import { Meteor } from 'meteor/meteor';
import { Machines } from '/imports/api/machines';

Meteor.startup(() => {
  // Only seed in dev mode
  if (Meteor.isDevelopment && Machines.find().count() === 0) {
    const seed = [
      { name: 'Machine 1', timestamp: new Date('2025-05-19T12:00:00Z'), cpu: '25%', gpu: '40%', ram: '60%', hdd: '80%' },
      { name: 'Machine 2', timestamp: new Date('2025-05-19T12:01:00Z'), cpu: '30%', gpu: '50%', ram: '70%', hdd: '90%' },
      { name: 'Machine 3', timestamp: new Date('2025-05-19T12:02:00Z'), cpu: '20%', gpu: '30%', ram: '50%', hdd: '70%' },
      { name: 'Machine 4', timestamp: new Date('2025-05-19T12:03:00Z'), cpu: '35%', gpu: '45%', ram: '65%', hdd: '85%' },
    ];

    seed.forEach((doc) => Machines.insert(doc));
  }
});
