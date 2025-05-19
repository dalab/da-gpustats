import { Meteor } from 'meteor/meteor';
import { MachineLogs } from '/imports/api/machines';

Meteor.startup(async () => {
  // Only seed in dev mode
  console.log('Starting up and seeding the database if necessary...');
  if (Meteor.isDevelopment && await MachineLogs.find().countAsync() === 0) {
    console.log('Seeding the database with initial data...');

    const now = Date.now();

    const sample = [
      /* Machine 1 --------------------------------------------------- */
      {
        machineId: 'machine-1',
        machineName: 'Machine 1',
        timestamp: new Date(now),
        gpus: [
          {
            id: 0,
            temperature: 70,
            memory_used: 6,
            memory_total: 24,
            utilization: 75,
            power: 220,
            users: ['alice'],
          },
          {
            id: 1,
            temperature: 65,
            memory_used: 0,
            memory_total: 24,
            utilization: 0,
            power: 50,
            users: [],
          },
        ],
        cpu: {
          nproc: 32,
          load_avg: 8.3,
          memory_used: 48,
          memory_total: 128,
          storage_used: 480,
          storage_total: 2000,
          procs: [],
        },
      },

      /* Machine 2 --------------------------------------------------- */
      {
        machineId: 'machine-2',
        machineName: 'Machine 2',
        timestamp: new Date(now - 30_000),
        gpus: [
          {
            id: 0,
            temperature: 60,
            memory_used: 4,
            memory_total: 16,
            utilization: 40,
            power: 150,
            users: ['bob'],
          },
        ],
        cpu: {
          nproc: 16,
          load_avg: 5.2,
          memory_used: 24,
          memory_total: 64,
          storage_used: 250,
          storage_total: 1000,
          procs: [],
        },
      },

      /* Machine 3 --------------------------------------------------- */
      {
        machineId: 'machine-3',
        machineName: 'Machine 3',
        timestamp: new Date(now - 60_000),
        gpus: [],
        cpu: {
          nproc: 8,
          load_avg: 0.2,
          memory_used: 2,
          memory_total: 32,
          storage_used: 100,
          storage_total: 500,
          procs: [],
        },
      },

      /* Machine 4 --------------------------------------------------- */
      {
        machineId: 'machine-4',
        machineName: 'Machine 4',
        timestamp: new Date(now - 90_000),
        gpus: [
          {
            id: 0,
            temperature: 72,
            memory_used: 10,
            memory_total: 24,
            utilization: 90,
            power: 240,
            users: ['carol'],
          },
          {
            id: 1,
            temperature: 71,
            memory_used: 8,
            memory_total: 24,
            utilization: 70,
            power: 200,
            users: ['carol'],
          },
        ],
        cpu: {
          nproc: 24,
          load_avg: 15,
          memory_used: 90,
          memory_total: 192,
          storage_used: 1200,
          storage_total: 4000,
          procs: [],
        },
      },
    ];

    sample.forEach(async (doc) => await MachineLogs.insertAsync(doc));
  }
});
