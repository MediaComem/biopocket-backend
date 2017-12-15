const _ = require('lodash');

const { expect } = require('../utils');
const geoJsonFixtures = require('./geojson');

describe('GeoJSON fixtures', () => {
  describe('coordinates', () => {

    const generateCoordinates = geoJsonFixtures.coordinates;

    it('should generate random coordinates', () => {

      const unique = [];
      _.times(100, () => {

        const coordinates = generateCoordinates();
        expect(coordinates).to.be.an('array');
        expect(coordinates).to.have.lengthOf(2);
        expect(coordinates[0]).to.be.a('number');
        expect(coordinates[0]).to.be.at.least(-180);
        expect(coordinates[0]).to.be.at.most(180);
        expect(coordinates[1]).to.be.a('number');
        expect(coordinates[1]).to.be.at.least(-90);
        expect(coordinates[1]).to.be.at.most(90);

        const fingerprint = coordinates.join(',');
        if (unique.indexOf(fingerprint) < 0) {
          unique.push(fingerprint);
        }
      });

      // Check that at least 90% of the coordinates are different
      // (we can't be 100% sure that they all will be).
      expect(unique).to.have.lengthOf.at.least(90);
    });

    describe('with the "bbox" option', () => {
      it('should generate random coordinates within a bounding box', () => {

        const bbox = {
          southWest: [ 10, 20 ],
          northEast: [ 20, 30 ]
        };

        const unique = [];
        _.times(100, () => {

          const coordinates = generateCoordinates({ bbox: bbox });
          expect(coordinates).to.be.an('array');
          expect(coordinates).to.have.lengthOf(2);
          expect(coordinates[0]).to.be.a('number');
          expect(coordinates[0]).to.be.at.least(10);
          expect(coordinates[0]).to.be.at.most(20);
          expect(coordinates[1]).to.be.a('number');
          expect(coordinates[1]).to.be.at.least(20);
          expect(coordinates[1]).to.be.at.most(30);

          const fingerprint = coordinates.join(',');
          if (unique.indexOf(fingerprint) < 0) {
            unique.push(fingerprint);
          }
        });

        // Check that at least 90% of the coordinates are different
        // (we can't be 100% sure that they all will be).
        expect(unique).to.have.lengthOf.at.least(90);
      });

      it('should not accept an invalid bounding box', () => {
        expect(() => generateCoordinates({ bbox: 666 })).to.throw('Bounding box must be an object');
      });

      it('should not accept a bounding box with a missing corner', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 20 ] } })).to.throw('Bounding box must have a "northEast" property');
        expect(() => generateCoordinates({ bbox: { northEast: [ 20, 30 ] } })).to.throw('Bounding box must have a "southWest" property');
      });

      it('should not accept missing coordinates', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 20 ], northEast: true } })).to.throw('Coordinates must be an array, got boolean');
      });

      it('should not accept the wrong number of coordinates', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 20, 30 ], northEast: [ 20, 30 ] } })).to.throw('Coordinates must be an array with 2 elements, but it has length 3');
      });

      it('should not accept coordinates that are not numbers', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 'asd', 20 ], northEast: [ 20, 30 ] } })).to.throw('Coordinates must contain only numbers, got string');
      });

      it('should not accept a longitude that is out of bounds', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 1000, 20 ], northEast: [ 20, 30 ] } })).to.throw('Longitude must be between -180 and 180, got 1000');
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 20 ], northEast: [ -200, 30 ] } })).to.throw('Longitude must be between -180 and 180, got -200');
      });

      it('should not accept a latitude that is out of bounds', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 200 ], northEast: [ 20, 30 ] } })).to.throw('Latitude must be between -90 and 90, got 200');
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 20 ], northEast: [ 20, -90.5 ] } })).to.throw('Latitude must be between -90 and 90, got -90.5');
      });
    })
  });
});
