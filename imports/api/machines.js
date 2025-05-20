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
/*  3. Publication — send ONLY the latest log per machine             */
/* ------------------------------------------------------------------ */
if (Meteor.isServer) {
  Meteor.publish('machines', async function () {
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

      if (latestSent.has(machineId)) {
        self.changed('machines', machineId, newest);
      } else {
        self.added('machines', machineId, newest);
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
        self.added('machines', doc.machineId, doc);
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
    const cursor = MachineLogs.find({});
    const handle = await cursor.observeChangesAsync({
      added(_id, fields) {
        // fields contains machineId already
        sendLatestSnapshot(fields.machineId).catch(console.error);
      },
      changed(_id) {
        MachineLogs.findOneAsync(_id)
          .then((doc) => doc && sendLatestSnapshot(doc.machineId))
          .catch(console.error);
      },
      removed(_id) {
        MachineLogs.findOneAsync(_id)
          .then((doc) => doc && sendLatestSnapshot(doc.machineId))
          .catch(console.error);
      },
    });

    self.onStop(() => handle.stop());
  });
}
