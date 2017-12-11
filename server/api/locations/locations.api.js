/**
 * Locations management API.
 *
 * @module server/api/locations
 */
const serialize = require('express-serializer');

const Location = require('../../models/location');
const { fetcher, route } = require('../utils/api');
const { validateRequestBody } = require('../utils/validation');
const { point: validateGeoJsonPoint } = require('../validators/geojson');
const policy = require('./locations.policy');

// API resource name (used in some API errors)
exports.resourceName = 'location';

/**
 * Creates a new location.
 *
 * @function
 */
exports.create = route(async (req, res) => {

  await validateLocation(req);

  const location = policy.parse(req.body);
  await location.save();

  res.status(201).send(await serialize(req, location, policy));
});

/**
 * Lists locations ordered by name.
 *
 * @function
 */
exports.list = route(async (req, res) => {

  const query = new Location();
  const locations = await query.orderBy('name').orderBy('created_at').fetchAll();

  res.send(await serialize(req, locations.models, policy));
});

/**
 * Retrieves a single location.
 *
 * @function
 */
exports.retrieve = route(async (req, res) => {
  res.send(await serialize(req, req.location, policy));
});

/**
 * Updates a location.
 *
 * @function
 */
exports.update = route(async (req, res) => {

  await validateLocation(req, true);

  const location = req.location;
  policy.parse(req.body, location);

  if (location.hasChanged()) {
    await location.save();
  }

  res.send(await serialize(req, location, policy));
});

/**
 * Deletes a location.
 *
 * @function
 */
exports.destroy = route(async (req, res) => {
  await req.location.destroy();
  res.sendStatus(204);
});

/**
 * Middleware that fetches the location identified by the ID in the URL.
 *
 * @function
 */
exports.fetchLocation = fetcher({
  model: Location,
  resourceName: exports.resourceName,
  coerce: id => id.toLowerCase(),
  validate: 'uuid'
});

/**
 * Validates the location in the request body.
 *
 * @param {Request} req - An Express request object.
 * @param {boolean} [patchMode=false] - If true, only properties that are set will be validated (i.e. a partial update with a PATCH request).
 * @returns {Promise<ValidationErrorBundle>} - A promise that will be resolved if the location is valid, or rejected with a bundle of errors if it is invalid.
 */
function validateLocation(req, patchMode = false) {
  return validateRequestBody(req, function() {
    return this.parallel(
      this.validate(
        this.json('/name'),
        this.if(patchMode, this.while(this.isSet())),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 150)
      ),
      this.validate(
        this.json('/shortName'),
        this.while(this.isSetAndNotNull()),
        this.type('string'),
        this.notBlank(),
        this.string(1, 30)
      ),
      this.validate(
        this.json('/description'),
        this.if(patchMode, this.while(this.isSet())),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 2000)
      ),
      this.validate(
        this.json('/phone'),
        this.if(patchMode, this.while(this.isSet())),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 20)
      ),
      this.validate(
        this.json('/photoUrl'),
        this.if(patchMode, this.while(this.isSet())),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 500)
      ),
      this.validate(
        this.json('/siteUrl'),
        this.if(patchMode, this.while(this.isSet())),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 500)
      ),
      this.validate(
        this.json('/geometry'),
        this.if(patchMode, this.while(this.isSet())),
        this.required(),
        this.geoJsonPoint()
      ),
      this.validate(
        this.json('/properties'),
        this.while(this.isSet()),
        this.type('object')
      ),
      this.validate(
        this.json('/address'),
        this.if(patchMode, this.while(this.isSet())),
        this.required(),
        this.type('object'),
        this.parallel(
          this.validate(
            this.json('/street'),
            this.if(patchMode, this.while(this.isSet())),
            this.required(),
            this.type('string'),
            this.notBlank(),
            this.string(1, 150),
            this.notBlank()
          ),
          this.validate(
            this.json('/number'),
            this.while(this.isSetAndNotNull()),
            this.type('string'),
            this.string(1, 10),
            this.notBlank()
          ),
          this.validate(
            this.json('/zipCode'),
            this.if(patchMode, this.while(this.isSet())),
            this.required(),
            this.type('string'),
            this.notBlank(),
            this.string(1, 15),
            this.notBlank()
          ),
          this.validate(
            this.json('/city'),
            this.if(patchMode, this.while(this.isSet())),
            this.required(),
            this.type('string'),
            this.notBlank(),
            this.string(1, 100),
            this.notBlank()
          ),
          this.validate(
            this.json('/state'),
            this.if(patchMode, this.while(this.isSet())),
            this.required(),
            this.type('string'),
            this.notBlank(),
            this.string(1, 30),
            this.notBlank()
          )
        )
      )
    );
  });
}
