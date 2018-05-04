const chance = require('chance').Chance();
const { stub } = require('sinon');

const app = require('../../app');

exports.req = function(data = {}) {
  return {
    app: data.app || app,
    body: data.body,
    get: data.get || stub(),
    method: data.method || 'GET',
    path: data.path || `/${chance.word()}`,
    query: data.query || {}
  };
};

exports.res = function(data = {}) {
  return {
    app: data.app || app,
    send: data.send || stub(),
    set: data.set || stub()
  };
};
