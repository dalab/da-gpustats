import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

export const Machines = new Mongo.Collection('machines');

if (Meteor.isServer) {
  Meteor.publish('machines', function () {
    // Just stream everything; order is decided on the client
    return Machines.find({});
  });
}
