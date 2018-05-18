/**
 * Configuration of the [express-jwt-policies](https://www.npmjs.com/package/express-jwt-policies) library.
 *
 * The settings in this file influence the behavior of the `auth.authenticate`
 * and `auth.authorize` functions used throughout `*.routes.js` files (in
 * `server/api/{subject}` directories) for authentication and/or authorization.
 *
 * @module server/api/utils/auth
 */
const expressJwtPolicies = require('express-jwt-policies');

const config = require('../../../config');
const User = require('../../models/user');
const errors = require('./errors');

const logger = config.logger('auth');

module.exports = expressJwtPolicies({

  /**
   * This middleware function is called by **express-jwt-policies** after
   * successful validation of a JWT token.
   *
   * It loads the user account corresponding to the "sub" claim of the token,
   * and attaches it to `req.currentUser` for later use by other middleware
   * functions.
   *
   * If no matching user is found or the user is inactive, a standard
   * unauthorized error (see {@link module:server/api/utils/errors}) is
   * forwarded to the next error middleware.  If another unexpected error
   * occurs, it is also forwarded to the next error-handling middleware.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @param {function} next - Function that calls the next middleware in the stack.
   * @see https://www.npmjs.com/package/express-jwt-policies
   */
  authenticatedResourceLoader(req, res, next) {
    User.where({
      api_id: req.jwtToken.sub || ''
    }).fetch().then(user => {
      if (!user || !user.isActive()) {
        throw errors.invalidAuthorization();
      }

      req.currentUser = user;
      logger.debug(`Authenticated as user ${user.get('api_id')}`);
    }).then(next).catch(next);
  },

  /**
   * This error-handling middleware function is called by
   * **express-jwt-policies** if an authentication error occurs (i.e. a problem
   * with the JWT token or the authenticated resource loader above).
   *
   * If the error is a known error such as a missing or malformed JWT token, it
   * is replaced by a standard unauthorized error (see {@link
   * module:server/api/utils/errors}) and forwarded to the next error-handling
   * middleware. Unexpected errors are forwarded without change.
   *
   * @param {Error} err - The error that occurred.
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @param {function} next - Function that calls the next middleware in the stack.
   * @see https://www.npmjs.com/package/express-jwt-policies
   */
  authenticationErrorHandler(err, req, res, next) {
    if (err.code === 'credentials_required') {
      logger.debug(`JWT authentication missing error: ${err.message}`);
      next(errors.missingAuthorization());
    } else if (err.code === 'credentials_bad_format' || err.code === 'credentials_bad_scheme') {
      logger.debug(`JWT authentication credentials error: ${err.message}`);
      next(errors.malformedAuthorization());
    } else if (err.status === 401) {
      logger.debug(`JWT authentication invalid error: ${err.message}`);
      next(errors.invalidAuthorization());
    } else {
      next(err);
    }
  },

  /**
   * This error-handling middleware function is called by
   * **express-jwt-policies** if an authorization error occurs (i.e. a custom
   * policy function determined that a user does not have access to a specific
   * resource).
   *
   * Such an error is usually replaced by a standard forbidden error (see {@link
   * module:server/api/utils/errors}) and forwarded to the next error-handling
   * middleware.
   *
   * However, if the authorization options passed to `auth.authorize` include a
   * `resourceName` property and a resource ID is found in `req.params.id`, then
   * the error will instead be replaced by a standard record not found (404)
   * error.
   *
   * This is meant to prevent unauthorized user from being able to tell the
   * difference between a resource that does not exist and a resource which they
   * are not authorized to access. If the former produced a 404 Not Found
   * response and the latter a 403 Forbidden response, it would be a dead
   * giveaway that the latter resource exists while the former does not.
   * Responding with 404 Not Found in both cases conceals that information.
   *
   * If the resource has an identifier which is not `req.params.id`, a custom
   * `resourceId` function can be passed to `auth.authorize` to retrieve the
   * correct ID from the request:
   *
   *     auth.authorize(policyFunc, {
   *       resourceName: 'user',
   *       resourceId: (req) => req.params.customId
   *     });
   *
   * @param {Error} err - The error that occurred.
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @param {function} next - Function that calls the next middleware in the stack.
   * @see https://www.npmjs.com/package/express-jwt-policies
   */
  authorizationErrorHandler(err, req, res, next) {
    if (err.status !== 403) {
      next(err);
      return;
    }

    const resourceName = req.authOptions.resourceName;
    const resourceId = req.authOptions.resourceId ? req.authOptions.resourceId(req) : req.params.id;
    if (resourceName && resourceId) {
      next(errors.recordNotFound(resourceName, resourceId));
      logger.debug(`Not authorized to access resource ${req.path} (${resourceName}/${resourceId})`);
    } else {
      next(errors.forbidden());
      logger.debug(`Not authorized to access resource ${req.path}`);
    }
  },

  // JWT secret used by the **express-jwt-policies** library to verify token
  // signatures, taken from the server's configuration.
  jwtSecret: config.sessionSecret
});
