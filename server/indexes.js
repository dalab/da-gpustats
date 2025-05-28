import { Meteor } from 'meteor/meteor';


const LOG_RETENTION_DAYS = 30;

Meteor.startup(async () => {
  
  const db  = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  const name = 'machine_logs';
  
  const info = await db.listCollections({ name }).next();
  if (!info) {
    const expireAfterSeconds = LOG_RETENTION_DAYS * 24 * 60 * 60;
    console.log(`Creating time-series collection "${name}" with retention of ${LOG_RETENTION_DAYS} days.`);
    await db.createCollection(name, {
      timeseries: {
        timeField   : 'timestamp',          // existing field
        metaField   : 'machineId',          // existing field
        granularity : 'seconds'
      },
      expireAfterSeconds: expireAfterSeconds   // TTL built-in
    });
  }
});
