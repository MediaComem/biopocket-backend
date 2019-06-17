const { isFinite, isInteger } = require('lodash');
const moment = require('moment');

const { toIso8601, toTimestamp } = require('../utils/conversion');

module.exports = function(chai, utils) {

  /**
   * Adds a timestampCloseAfter assertion that can be used to assert that a Unix
   * timestamp in seconds is equal to or only slightly later than a given
   * date.
   *
   * @example
   * expect(value).to.be.timestampCloseAfter(Date.now());
   * expect(value).to.be.timestampCloseAfter(new Date());
   * expect(value).to.be.timestampCloseAfter(moment().subtract(2, 'days'));
   *
   * // Custom threshold in seconds
   * expect(value).to.be.timestampCloseAfter(Date.now(), 3);
   */
  chai.Assertion.addMethod('timestampCloseAfter', function(expected, margin = 1) {
    if (margin === undefined) {
      throw new Error('The "margin" option must be specified');
    } else if (!isFinite(margin) || margin < 0) {
      throw new Error('The "margin" option must be a valid number greater than or equal to zero');
    }

    const obj = utils.flag(this, 'object');
    this.assert(isInteger(obj) && obj >= 0, 'expected #{this} to be a Unix timestamp', 'expected #{this} not to be a Unix timestamp');

    const min = toTimestamp(expected);
    this.assert(obj >= min, `expected #{this} (${toIso8601(obj)}) to be greater than or equal to ${min} (${toIso8601(min)})`, `expected #{this} (${toIso8601(obj)}) not to be greater than or equal to ${min} (${toIso8601(min)})`);

    const max = moment.unix(min).add(margin, 'seconds').unix();
    this.assert(obj <= max, `expected #{this} (${toIso8601(obj)}) to be smaller than or equal to ${max} (${toIso8601(max)})`, `expected #{this} (${toIso8601(obj)}) not to be smaller than or equal to ${max} (${toIso8601(max)})`);
  });
};
