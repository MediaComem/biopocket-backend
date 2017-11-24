const chance = require('chance').Chance();
const _ = require('lodash');
const { unique: uniqueGenerator } = require('test-value-generator');

const User = require('../../models/user');
const { createRecord } = require('../utils');

exports.user = function(data) {
  data = data || {};

  return createRecord(User, {
    email: data.email || exports.email(data.firstName, data.lastName),
    password: data.password || exports.password(),
    active: _.get(data, 'active', true),
    roles: data.roles || [],
    created_at: data.createdAt,
    updated_at: data.updatedAt
  });
};

exports.admin = function(data) {
  return exports.user(_.merge({}, data, { roles: [ 'admin' ] }));
};

exports.email = uniqueGenerator(function(firstName, lastName) {
  return `${firstName || chance.first().toLowerCase()}.${lastName || chance.last().toLowerCase()}@example.com`;
});

exports.password = uniqueGenerator(function() {
  return chance.string();
});
