const serialize = require('express-serializer');

const { route } = require('../utils/api');
const { validateRequestBody } = require('../utils/validation');
const { point: validateGeoJsonPoint } = require('../validators/geojson');
const policy = require('./locations.policy');

exports.create = route(async (req, res) => {

  await validateLocation(req);

  const location = policy.parse(req.body);
  await location.save();

  res.status(201).send(await serialize(req, location, policy));
});


function validateLocation(req) {
  return validateRequestBody(req, function() {
    return this.parallel(
      this.validate(
        this.json('/name'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 150)
      ),
      this.validate(
        this.json('/shortName'),
        this.while(this.isSet()),
        this.type('string'),
        this.notBlank(),
        this.string(1, 30)
      ),
      this.validate(
        this.json('/description'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 2000)
      ),
      this.validate(
        this.json('/phone'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 20)
      ),
      this.validate(
        this.json('/photoUrl'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 500)
      ),
      this.validate(
        this.json('/siteUrl'),
        this.required(),
        this.type('string'),
        this.notBlank(),
        this.string(1, 500)
      ),
      this.validate(
        this.json('/geometry'),
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
        this.required(),
        this.type('object'),
        this.parallel(
          this.validate(
            this.json('/street'),
            this.required(),
            this.type('string'),
            this.string(1, 150),
            this.notBlank()
          ),
          this.validate(
            this.json('/number'),
            this.while(this.isSet()),
            this.type('string'),
            this.string(1, 10),
            this.notBlank()
          ),
          this.validate(
            this.json('/zipCode'),
            this.required(),
            this.type('string'),
            this.string(1, 15),
            this.notBlank()
          ),
          this.validate(
            this.json('/city'),
            this.required(),
            this.type('string'),
            this.string(1, 100),
            this.notBlank()
          ),
          this.validate(
            this.json('/state'),
            this.required(),
            this.type('string'),
            this.string(1, 30),
            this.notBlank()
          )
        )
      )
    );
  });
}
