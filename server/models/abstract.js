const _ = require('lodash');
const db = require('../db');
const inflection = require('inflection');

const proto = db.bookshelf.Model.prototype;

/**
 * Abstract database model.
 *
 * @class
 * @extends bookshelf.Model
 */
const Abstract = db.bookshelf.Model.extend({

  /**
   * Parses data from the specified source into this record's columns.
   *
   *     // The following code:
   *     record.parseFrom(data, [ 'name', 'siteUrl' ]);
   *
   *     // Is equivalent to:
   *     if (data.hasOwnProperty('name')) {
   *       record.set('name', data.name);
   *     }
   *     if (data.hasOwnProperty('siteUrl')) {
   *       record.set('site_url', data.siteUrl);
   *     }
   *
   *     // The following code:
   *     record.parseFrom(data, [ 'street', 'zipCode' ], { columnPrefix: 'address_', sourcePrefix: 'address.' });
   *
   *     // Is equivalent to:
   *     if (data.hasOwnProperty('address') && data.address.hasOwnProperty('street')) {
   *       record.set('address_street', data.address.street);
   *     }
   *     if (data.hasOwnProperty('address') && data.address.hasOwnProperty('zipCode')) {
   *       record.set('address_zip_code', data.address.zipCode);
   *     }
   *
   * @method
   * @memberof Abstract
   * @instance
   * @param {object} source - Source object (typically the parsed JSON request body).
   * @param {string[]} properties - Camel-cased properties of the source object to parse.
   *   The column names will correspond to the underscored names of the properties (e.g. `zipCode` => `zip_code`).
   * @param {object} [options] - Deserialization options.
   * @param {string} [options.columnPrefix] - Prefix to prepend to column names.
   *   For example, if the prefix is `address_` and one of the properties to parse is `zipCode`, the column
   *   in which the value is stored will be `address_zip_code`.
   * @param {string} [options.sourcePrefix] - Prefix to prepend to property names before extracting them from the
   *   source object. For example, if the prefix is `address.` and one of the properties to parse is `zipCode`, the
   *   `zipCode` property of the source's object `address` sub-object will be extracted.
   * @returns {Model} This record.
   */
  parseFrom: function(source, properties, options = {}) {

    const columnPrefix = options.columnPrefix || '';
    const sourcePrefix = options.sourcePrefix || '';

    for (let property of properties) {

      // Determine the complete source property name, e.g. `zipCode` or `address.zipCode` (with the "sourcePrefix" option).
      const sourceProperty = `${sourcePrefix}${property}`;

      // Only parse the property if it's in the source object.
      if (_.has(source, sourceProperty)) {
        // Determine the column name by underscoring the property name and prepending the column prefix (if any).
        const column = `${columnPrefix}${inflection.underscore(property)}`;
        this.set(column, _.get(source, sourceProperty));
      }
    }

    return this;
  },

  /**
   * Serializes columns of this record into the specified target object.
   *
   *     // The following code:
   *     record.serializeTo(target, [ 'name', 'site_url' ]);
   *
   *     // Is equivalent to:
   *     if (record.has('name')) {
   *       target.name = record.get('name');
   *     }
   *     if (record.has('site_url')) {
   *       target.siteUrl = record.get('site_url');
   *     }
   *
   *     // The following code:
   *     record.serializeTo(target, [ 'street', 'zip_code' ], { columnPrefix: 'address_', targetPrefix: 'address.' });
   *
   *     // Is equivalent to:
   *     if (!target.hasOwnProperty('address')) {
   *       target.address = {};
   *     }
   *     if (record.has('address_street')) {
   *       target.address.street = record.get('address_street');
   *     }
   *     if (record.has('address_zip_code')) {
   *       target.address.zipCode = record.get('address_zip_code');
   *     }
   *
   * @method
   * @memberOf Abstract
   * @instance
   * @param {object} target - Target object to attach serialized properties to.
   * @param {string[]} properties - Underscored column names of the record to serialize.
   *   The target property names will correspond to the camelized names of the columns (e.g. `zip_code` => `zipCode`).
   * @param {object} [options] - Serialization options.
   * @param {string} [options.columnPrefix] - Prefix to prepend to the column names to serialize. For example, if the
   *   prefix is `address` and one of the columns to serialize is `zip_code`, the column from which the value is
   *   extracted will be `address_zip_code`.
   * @param {string} [options.targetPrefix] - Prefix to prepend to the property names of the target object. For
   *   example, if the target prefix is `address.` and one of the columns to serialize is `zip_code`, the `zipCode`
   *   property of the target object's `address` sub-object will be set to the value of the column.
   * @returns {object} The target object.
   */
  serializeTo: function(target, properties, options = {}) {

    const columnPrefix = options.columnPrefix || '';
    const targetPrefix = options.targetPrefix || '';

    for (let property of properties) {
      const column = `${columnPrefix}${property}`;
      if (this.has(column)) {
        const columnWithoutPrefix = column.slice(columnPrefix.length);
        const targetProperty = `${targetPrefix}${inflection.camelize(columnWithoutPrefix, true)}`;
        _.set(target, targetProperty, this.get(column));
      }
    }

    return target;
  }
});

module.exports = Abstract;
