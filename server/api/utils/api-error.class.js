const { isInteger, isString } = require('lodash');

/**
 * An API error.
 *
 * When thrown from an API route or middleware, an error of this type will
 * automatically be serialized as JSON and the HTTP response will have the
 * correct status code.
 *
 * @class
 * @extends Error
 * @property {string} name - The type of error.
 * @property {number} status - The HTTP status code to respond with when this error occurs.
 * @property {string} code - A code identifying the error (e.g. `category.whatWentWrong`).
 * @property {string} message - A description of the problem.
 * @property {Object} headers - Headers that should be added to the headers of the response sending back this error.
 */
class ApiError extends Error {

  /**
   * Creates a new ApiError instance, with the given status, code and message.
   *
   * @param {number} status - The HTTP status code to respond with when this error occurs.
   * @param {string} code - A code identifying the error (e.g. `category.whatWentWrong`). Must be an integer.
   * @param {string} [message] - A description of the problem.
   *
   * @throws {TypeError} If no `status` argument is provided or it is not an integer.
   * @throws {TypeError} If no `code` argument is provided or it is not a string.
   */
  constructor(status, code, message) {
    if (!status || !isInteger(status)) {
      throw new TypeError(`The status argument must be a integer ; ${typeof status} given`);
    } else if (!code || !isString(code)) {
      throw new TypeError(`The code argument must be a string ; ${typeof code} given`);
    }
    super(message);
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.status = status;
    this.code = code;
    this.headers = {};
  }

  /**
   * Adds a new header and its value to this ApiError instance.
   *
   * @method
   * @instance
   * @param {string} name - The name of the new header.
   * @param {string} value - The value of the new header.
   * @throws {TypeError} If no `name` parameter is provided or it is not a string.
   * @throws {TypeError} If no `value` parameter is provided.
   * @returns {ApiError} This ApiError instance.
   */
  header(name, value) {
    if (!name || !isString(name)) {
      throw new TypeError(`A name argument is required as the first argument to the header method, and it must be a string ; ${typeof name} given`);
    } else if (!value) {
      throw new TypeError('A value argument is required as the second argument to the header method');
    }

    this.headers[name] = value;
    return this;
  }
}

module.exports = ApiError;
