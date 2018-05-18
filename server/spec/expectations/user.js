const bcrypt = require('bcryptjs');
const _ = require('lodash');

const User = require('../../models/user');
const { checkRecord, expect, toArray } = require('../utils');

module.exports = function(actual, expected) {

  expect(actual, 'res.body').to.be.an('object');
  expect(actual, 'res.body').to.have.all.keys([
    'active',
    'createdAt',
    'id',
    'email',
    'roles',
    'updatedAt'
  ]);

  expect(actual.active, 'user.active').to.equal(_.get(expected, 'active', true));

  if (expected.id) {
    expect(actual.id, 'user.id').to.equal(expected.id);
  } else {
    expect(actual.id, 'user.id').to.be.a('string');
  }

  expect(actual.email, 'user.email').to.equal(expected.email);

  expect(actual.roles, 'user.roles').to.eql(_.get(expected, 'roles', []));

  expect(actual.createdAt, 'user.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt === 'createdAt') {
    expect(actual.updatedAt, 'user.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'user.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  // Check that the corresponding user exists in the database.
  return module.exports.inDb(_.merge({}, actual, _.pick(expected, 'password')));
};

module.exports.inDb = async function(expected) {

  const user = await checkRecord(User, expected.id);
  expect(user, 'db.user').to.be.an.instanceof(User);

  expect(user.get('active'), 'db.user.active').to.equal(expected.active);
  expect(user.get('api_id'), 'db.user.api_id').to.equal(expected.id);
  expect(user.get('id'), 'db.user.id').to.be.a('string');
  expect(user.get('email'), 'db.user.email').to.equal(expected.email);
  expect(user.get('roles'), 'db.user.roles').to.eql(expected.roles);
  expect(user.get('created_at'), 'db.user.created_at').to.be.sameMoment(expected.createdAt);
  expect(user.get('updated_at'), 'db.user.updated_at').to.be.sameMoment(expected.updatedAt);

  if (expected.password) {
    expect(bcrypt.compareSync(expected.password, user.get('password_hash')), 'db.user.password_hash').to.equal(true);
    expect(user.hasPassword(expected.password), 'db.user.password_hash').to.equal(true);
  } else {
    expect(user.get('password_hash')).to.be.a('string');
  }
};
