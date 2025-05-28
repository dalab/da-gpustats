import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { MachineLogs } from './machines';


function makePipeline(from, to, userId = null, machineId = null, unit = "hour", timezone = "UTC") {
  const stages = [];
  stages.push({ $match: { timestamp: { $gte: from, $lt: to } } });
  stages.push({ $unwind: "$gpus" }, { $unwind: "$gpus.users" });
  stages.push({ $set: { gpuIdx: "$gpus.idx", userId: "$gpus.users" } });
  stages.push({ $project: { gpuIdx: 1, machineId: 1, userId: 1, timestamp: 1} });
  if (!!userId) stages.push({ $match: { userId: userId } });
  if (!!machineId) stages.push({ $match: { machineId: machineId } });
  stages.push({ $set: { gapSec: { $ifNull: ["$log_interval", 30] } } });
  stages.push({ $set: { bucket: {
    $dateTrunc: { date: "$timestamp", unit: unit, timezone: timezone }
  } } });
  stages.push({ $group: {
    _id: { userId: "$userId", bucket: "$bucket" },
    gpuHours: { $sum: { $divide: ["$gapSec", 3600.0] } }
  } });
  stages.push({ $project: { _id: 0, bucket: "$_id.bucket", gpuHours: "$gpuHours" } });
  stages.push({ $sort: { bucket: 1 } });
  return stages;
}

function makeSummaryPipeline(from, to, group) {
  check(group, Match.OneOf("machineId", "userId"));
  const stages = []
  stages.push({ $match: { timestamp: { $gte: from, $lt: to } } });
  stages.push({ $unwind: "$gpus" }, { $unwind: "$gpus.users" });
  stages.push({ $set: { gpuIdx: "$gpus.idx", userId: "$gpus.users" } });
  stages.push({ $project: { gpuIdx: 1, machineId: 1, userId: 1, timestamp: 1} });
  stages.push({ $set: { gapSec: { $ifNull: ["$log_interval", 30] } } });
  stages.push({ $group: {
    _id: { groupId: `$${group}` },
    gpuHours: { $sum: { $divide: ["$gapSec", 3600.0] } }
  } });
  stages.push({ $project: { _id: 0, id: "$_id.groupId", gpuHours: "$gpuHours" } });
  stages.push({ $sort: { gpuHours: -1 } });
  return stages;
}


if (Meteor.isServer) {
  Meteor.methods({
    async "usage/by_user"(userId, fromIso, toIso, unit = "hour", timezone = "UTC") {
      check(userId, String);
      check(fromIso, String);
      check(toIso, String);
      check(unit, Match.OneOf("hour", "day", "week", "month"));

      const from = new Date(fromIso);
      const to = new Date(toIso);

      const cursor = MachineLogs.rawCollection()
        .aggregate(makePipeline(from, to, userId, null, unit, timezone), { allowDiskUse: true });
      
      const result = await cursor.toArray();
      console.log(`usage/by_user: ${result.length} records found for user '${userId}' from ${fromIso} to ${toIso} with unit "${unit}" and timezone "${timezone}"`);
      return result;
    },
    async "usage/by_machine"(machineId, fromIso, toIso, unit = "hour", timezone = "UTC") {
      check(machineId, String);
      check(fromIso, String);
      check(toIso, String);
      check(unit, Match.OneOf("hour", "day", "week", "month"));

      const from = new Date(fromIso);
      const to = new Date(toIso);

      const cursor = MachineLogs.rawCollection()
        .aggregate(makePipeline(from, to, null, machineId, unit, timezone), { allowDiskUse: true });
      
      const result = await cursor.toArray();
      console.log(`usage/by_user: ${result.length} records found from ${fromIso} to ${toIso} with unit "${unit}" and timezone "${timezone}"`);
      return result;
    },
    async "usage/all_users"(fromIso, toIso) {
      console.log(`usage/all_users: fromIso=${fromIso}, toIso=${toIso}`);
      check(fromIso, String);
      check(toIso, String);

      const from = new Date(fromIso);
      const to = new Date(toIso);

      const cursor = MachineLogs.rawCollection()
        .aggregate(makeSummaryPipeline(from, to, "userId"), { allowDiskUse: true });
      
      const result = await cursor.toArray();
      console.log(`usage/all_users: ${result.length} records found from ${fromIso} to ${toIso}"`);
      return result;
    },
    async "usage/all_machines"(fromIso, toIso) {
      console.log(`usage/all_machines: fromIso=${fromIso}, toIso=${toIso}`);
      check(fromIso, String);
      check(toIso, String);

      const from = new Date(fromIso);
      const to = new Date(toIso);

      const cursor = MachineLogs.rawCollection()
        .aggregate(makePipeline(from, to, "machineId"), { allowDiskUse: true });
      
      const result = await cursor.toArray();
      console.log(`usage/all_machines: ${result.length} records found from ${fromIso} to ${toIso}"`);
      return result;
    }
  });
}
