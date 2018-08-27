/**
 * Data utilities
 */

/**
* Utility function that helps creating sample data.
*
* @param {number} n - The number of elements to create.
* @param {function} factory - A factory function that creates the elements.
* @param {Object} options - Custom options to pass to the factory function.
* @returns {Promise[]} An array of promise
*/
function create(n, factory, options) {
  return Promise.all(new Array(n).fill(0).map(() => factory(options)));
}

module.exports = {
  create
};
