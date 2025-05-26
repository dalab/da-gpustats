import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';


/** Per-machine **time-series** documents (persisted in MongoDB). */
export const MachineLogs = new Mongo.Collection('machine_logs');

/** Per-machine **snapshot** that the client subscribes to.  
 *  Lives only in Minimongo for each connected client.               */
export const MachineSnapshots = new Mongo.Collection('machine_snapshots');

MachineLogs.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

MachineSnapshots.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});


if (Meteor.isServer) {
  Meteor.publish('machine_snapshots', async function () {
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
          self.removed('machine_snapshots', machineId);
          latestSent.delete(machineId);
        }
        return;
      }

      if (latestSent.has(machineId)) {
        self.changed('machine_snapshots', machineId, newest);
      } else {
        self.added('machine_snapshots', machineId, newest);
      }
      latestSent.set(machineId, newest.timestamp);
    };

    /* -------------------------------------------------------------- */
    /* Initial load                                                   */
    /* -------------------------------------------------------------- */
    (async () => {
      const machineIds = await MachineLogs.rawCollection().distinct('machineId');
      if (machineIds.length === 0) {
        self.ready();
        return;
      }

      // Instead of fetching all logs, we can just get the latest for each machine
      const proms = [];
      for (const machineId of machineIds) {
        proms.push(sendLatestSnapshot(machineId));
      }
      await Promise.all(proms);
      self.ready();
    })().catch((err) => {
      console.error('machines publication startup error:', err);
      self.error(err);
    });

    /* -------------------------------------------------------------- */
    /* Live updates                                                   */
    /* -------------------------------------------------------------- */
    const handle = await MachineLogs
    .find({}, { fields: { machineId: 1, timestamp: 1 }, sort: { timestamp: -1 }, limit: 1 })
    .observeChangesAsync({
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
