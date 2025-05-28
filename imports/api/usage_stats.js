import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { MachineLogs } from './machines';


function makePipeline(userId, from, to, unit = "hour", timezone = "UTC") {
  return [
    { $match: { timestamp: { $gte: from, $lt: to } } },
    { $unwind: "$gpus" }, { $unwind: "$gpus.users" },
    { $set: { gpuIdx: "$gpus.idx", userId: "$gpus.users" } },
    { $project: { gpuIdx: 1, machineId: 1, userId: 1, timestamp: 1} },
    { $match: { userId: userId } },
    { $set: { gapSec: { $ifNull: ["$log_interval", 30] } } },
    { $set: { bucket: {
      $dateTrunc: { date: "$timestamp", unit: unit, timezone: timezone }
    } } },
    { $group: {
      _id: { userId: "$userId", bucket: "$bucket" },
      gpuHours: { $sum: { $divide: ["$gapSec", 3600.0] } }
    } },
    { $project: { _id: 0, bucket: "$_id.bucket", gpuHours: "$gpuHours" } },
    { $sort: { bucket: 1 } }
  ];
}


if (Meteor.isServer) {
  Meteor.methods({
    async "usage/by_user"(userId, fromIso, toIso, unit = "hour", timezone = "UTC") {
      check(userId, String);
      check(fromIso, String);
      check(toIso, String);
      check(unit, Match.OneOf("hour", "day"));

      const from = new Date(fromIso);
      const to = new Date(toIso);

      const cursor = MachineLogs.rawCollection()
        .aggregate(makePipeline(userId, from, to, unit, timezone), { allowDiskUse: true });
      
      const result = await cursor.toArray();
      console.log({ userId, fromIso, toIso, unit, timezone });
      console.log(result);
      console.log(`usage/by_user: ${result.length} records found from ${fromIso} to ${toIso} with unit "${unit}" and timezone "${timezone}"`);
      return result;
    }
  });
}
