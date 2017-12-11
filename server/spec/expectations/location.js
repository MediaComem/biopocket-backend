const _ = require('lodash');

const Location = require('../../models/location');
const { checkRecord, expect, toArray } = require('../utils');

module.exports = function(actual, expected) {

  expect(actual, 'res.body').to.be.an('object');

  const expectedKeys = [ 'id', 'name', 'description', 'phone', 'photoUrl', 'siteUrl', 'geometry', 'address', 'properties', 'createdAt', 'updatedAt' ];
  if (_.has(actual, 'shortName')) {
    expectedKeys.push('shortName');
  }

  expect(actual, 'res.body').to.have.all.keys(expectedKeys);

  if (expected.id) {
    expect(actual.id, 'location.id').to.equal(expected.id);
  } else {
    expect(actual.id, 'location.id').to.be.a('string');
  }

  expect(actual.name, 'location.name').to.equal(expected.name);

  if (expected.shortName) {
    expect(actual.shortName, 'location.shortName').to.equal(expected.shortName);
  } else {
    expect(actual.shortName, 'location.shortName').to.equal(undefined);
  }

  expect(actual.description, 'location.description').to.equal(expected.description);
  expect(actual.phone, 'location.phone').to.equal(expected.phone);
  expect(actual.photoUrl, 'location.photoUrl').to.equal(expected.photoUrl);
  expect(actual.siteUrl, 'location.siteUrl').to.equal(expected.siteUrl);
  expect(actual.geometry, 'location.geometry').to.eql(expected.geometry);

  expect(actual.address, 'location.address').to.be.an('object');

  const expectedAddressKeys = [ 'street', 'city', 'state', 'zipCode' ];
  if (expected.address.number) {
    expectedAddressKeys.push('number');
  }

  expect(actual.address, 'location.address').to.have.all.keys(expectedAddressKeys);
  expect(actual.address.street, 'location.address.street').to.equal(expected.address.street);

  if (expected.address.number) {
    expect(actual.address.number, 'location.address.number').to.equal(expected.address.number);
  } else {
    expect(actual.address.number, 'location.address.number').to.equal(undefined);
  }

  expect(actual.address.zipCode, 'location.address.zipCode').to.equal(expected.address.zipCode);
  expect(actual.address.city, 'location.address.city').to.equal(expected.address.city);
  expect(actual.address.state, 'location.address.state').to.equal(expected.address.state);

  expect(actual.properties, 'location.properties').to.be.an('object');
  expect(actual.properties, 'location.properties').to.eql(expected.properties);

  expect(actual.createdAt, 'location.createdAt').to.be.iso8601(...toArray(expected.createdAt));

  if (expected.updatedAt == 'createdAt') {
    expect(actual.updatedAt, 'location.updatedAt').to.equal(actual.createdAt);
  } else {
    expect(actual.updatedAt, 'location.updatedAt').to.be.iso8601(...toArray(expected.updatedAt));
  }

  // Check that the corresponding location exists in the database.
  return module.exports.inDb(actual);
};

module.exports.inDb = async function(expected) {

  const location = await checkRecord(Location, expected.id);
  expect(location, 'db.location').to.be.an.instanceof(Location);

  expect(location.get('api_id'), 'db.location.api_id').to.equal(expected.id);
  expect(location.get('id'), 'db.location.id').to.be.a('string');
  expect(location.get('name', 'db.location.name')).to.equal(expected.name);
  expect(location.get('short_name'), 'db.location.short_name').to.equal(expected.shortName || null);
  expect(location.get('description', 'db.location.description')).to.equal(expected.description);
  expect(location.get('photo_url', 'db.location.photo_url')).to.equal(expected.photoUrl);
  expect(location.get('site_url', 'db.location.site_url')).to.equal(expected.siteUrl);
  expect(location.get('phone', 'db.location.phone')).to.equal(expected.phone);
  expect(location.get('geometry', 'db.location.geometry')).to.eql(expected.geometry);
  expect(location.get('properties', 'db.location.properties')).to.eql(expected.properties);
  expect(location.get('address_street'), 'db.location.address_street').to.equal(expected.address.street);
  expect(location.get('address_number'), 'db.location.address_number').to.equal(expected.address.number || null);
  expect(location.get('address_zip_code'), 'db.location.address_zip_code').to.equal(expected.address.zipCode);
  expect(location.get('address_city'), 'db.location.address_city').to.equal(expected.address.city);
  expect(location.get('address_state'), 'db.location.address_state').to.equal(expected.address.state);
  expect(location.get('created_at'), 'db.location.created_at').to.be.sameMoment(expected.createdAt);
  expect(location.get('updated_at'), 'db.location.updated_at').to.be.sameMoment(expected.updatedAt);
};
