import { Meteor } from 'meteor/meteor';
import { MachineLogs } from '/imports/api/machines';

Meteor.startup(async () => {
  if (process.env.LOG_RETENTION_DAYS === undefined) {
    console.warn('LOG_RETENTION_DAYS not set, using default of 30 days');
  }
  const daysToKeep = parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
  const expireAfterSeconds = daysToKeep * 24 * 60 * 60;

  await MachineLogs.rawCollection().createIndex(
    { timestamp: 1 },
    { expireAfterSeconds }
  );
});
