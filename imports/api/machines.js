import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

/* ------------------------------------------------------------------ */
/*  1. Collections                                                    */
/* ------------------------------------------------------------------ */

/** Per-machine **time-series** documents (persisted in MongoDB). */
export const MachineLogs = new Mongo.Collection('machine_logs');

/** Per-machine **snapshot** that the client subscribes to.  
 *  Lives only in Minimongo for each connected client.               */
export const Machines = new Mongo.Collection('machines');

MachineLogs.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Machines.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

/* ------------------------------------------------------------------ */
/*  2. Helper — build the aggregated snapshot expected by the UI      */
/* ------------------------------------------------------------------ */
function buildSnapshot(doc) {
  const gpuAvg =
    doc.gpus.length === 0
      ? 0
      : doc.gpus.reduce((sum, g) => sum + g.utilization, 0) /
        doc.gpus.length;

  const cpuPct =
    doc.cpu.nproc === 0 ? 0 : (doc.cpu.load_avg / doc.cpu.nproc) * 100;

  const ramPct =
    doc.cpu.memory_total === 0
      ? 0
      : (doc.cpu.memory_used / doc.cpu.memory_total) * 100;

  const hddPct =
    doc.cpu.storage_total === 0
      ? 0
      : (doc.cpu.storage_used / doc.cpu.storage_total) * 100;

  return {
    /* stable key used on the client for sorting / local-storage order */
    _id: doc.machineId,

    /* data the UI expects */
    name: doc.machineName,
    timestamp: doc.timestamp,

    cpu: `${cpuPct.toFixed(0)}%`,
    gpu: `${gpuAvg.toFixed(0)}%`,
    ram: `${ramPct.toFixed(0)}%`,
    hdd: `${hddPct.toFixed(0)}%`,
  };
}

/* ------------------------------------------------------------------ */
/*  3. Publication — send ONLY the latest log per machine             */
/* ------------------------------------------------------------------ */
if (Meteor.isServer) {
  Meteor.publish('machines', function () {
    const self = this;
    const latestSent = new Map();            // machineId → timestamp

    /* Helper: (re)send the freshest log for a machine -------------- */
    const sendLatestSnapshot = async (machineId) => {
      const newest = await MachineLogs.findOneAsync(
        { machineId },
        { sort: { timestamp: -1 } }
      );
      if (!newest) {
        // No log left → remove the snapshot completely
        if (latestSent.has(machineId)) {
          self.removed('machines', machineId);
          latestSent.delete(machineId);
        }
        return;
      }

      const snap = buildSnapshot(newest);
      if (latestSent.has(machineId)) {
        self.changed('machines', machineId, snap);
      } else {
        self.added('machines', machineId, snap);
      }
      latestSent.set(machineId, newest.timestamp);
    };

    /* -------------------------------------------------------------- */
    /* Initial load (await!)                                          */
    /* -------------------------------------------------------------- */
    (async () => {
      const all = await MachineLogs.find(
        {},                                   // every log
        { sort: { machineId: 1, timestamp: -1 } }
      ).fetchAsync();                         // ← async!

      const firstOfEach = new Map();          // machineId → doc
      for (const doc of all) {
        if (!firstOfEach.has(doc.machineId)) firstOfEach.set(doc.machineId, doc);
      }

      for (const doc of firstOfEach.values()) {
        const snap = buildSnapshot(doc);
        self.added('machines', doc.machineId, snap);
        latestSent.set(doc.machineId, doc.timestamp);
      }
      self.ready();
    })().catch((err) => {
      console.error('machines publication startup error:', err);
      self.error(err);
    });

    /* -------------------------------------------------------------- */
    /* Live updates (observeChanges is sync but we call async helpers)*/
    /* -------------------------------------------------------------- */
    const handle = MachineLogs.find().observeChanges({
      added(_id, fields) {
        // fields contains machineId already
        sendLatestSnapshot(fields.machineId).catch(console.error);
      },
      changed(id) {
        MachineLogs.findOneAsync(id)
          .then((doc) => doc && sendLatestSnapshot(doc.machineId))
          .catch(console.error);
      },
      removed(id) {
        MachineLogs.findOneAsync(id)
          .then((doc) => doc && sendLatestSnapshot(doc.machineId))
          .catch(console.error);
      },
    });

    self.onStop(() => handle.stop());
  });
}
