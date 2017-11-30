const expressJwtPolicies = require('express-jwt-policies');

const config = require('../../../config');
const User = require('../../models/user');
const errors = require('./errors');

const logger = config.logger('auth');

module.exports = expressJwtPolicies({

  authenticatedResourceLoader: function(req, res, next) {
    return User.where({
      api_id: req.jwtToken.sub || ''
    }).fetch().then(user => {
      if (!user || !user.isActive()) {
        throw errors.invalidAuthorization();
      }

      req.currentUser = user;
      logger.debug(`Authenticated with user ${user.get('api_id')}`);
    }).then(next).catch(next);
  },

  authenticationErrorHandler: function(err, req, res, next) {
    if (err.code == 'credentials_required') {
      logger.debug(`JWT authentication missing error: ${err.message}`);
      next(errors.missingAuthorization());
    } else if (err.code == 'credentials_bad_format' || err.code == 'credentials_bad_scheme') {
      logger.debug(`JWT authentication credentials error: ${err.message}`);
      next(errors.malformedAuthorization());
    } else if (err.status == 401) {
      logger.debug(`JWT authentication invalid error: ${err.message}`);
      next(errors.invalidAuthorization());
    } else {
      next(err);
    }
  },

  authorizationErrorHandler: function(err, req, res, next) {
    if (err.status != 403) {
      return next(err);
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

  jwtSecret: config.sessionSecret
});
