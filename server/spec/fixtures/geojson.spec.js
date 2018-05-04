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

          const coordinates = generateCoordinates({ bbox });
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

      it('should not accept a south-west point with a greater latitude than the north-east point', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 20 ], northEast: [ 20, 15 ] } })).to.throw('Bounding box south west [10,20] has a greater latitude than north east [20,15]');
      });

      it('should not accept a south-west point with a greater longitude than the north-east point', () => {
        expect(() => generateCoordinates({ bbox: { southWest: [ 10, 20 ], northEast: [ 5, 30 ] } })).to.throw('Bounding box south west [10,20] has a greater longitude than north east [5,30]');
      });

      describe('with a "padding" option', () => {

        // Test all padding formats.
        [
          { bbox: [ 10, 20, 20, 30 ], padding: [ 2, 3, 4, 3 ], effectiveBbox: [ 13, 24, 17, 28 ] },
          { bbox: [ 10, 20, 20, 30 ], padding: [ 1, 2, 3 ], effectiveBbox: [ 12, 23, 18, 29 ] },
          { bbox: [ 10, 20, 20, 30 ], padding: [ 2, 1 ], effectiveBbox: [ 11, 22, 19, 28 ] },
          { bbox: [ 10, 20, 20, 30 ], padding: [ 3 ], effectiveBbox: [ 13, 23, 17, 27 ] },
          { bbox: [ 10, 20, 20, 30 ], padding: 2.5, effectiveBbox: [ 12.5, 22.5, 17.5, 27.5 ] }
        ].forEach(paddingTestData => {
          it(`should take a padding of ${JSON.stringify(paddingTestData.padding)} into account`, () => {

            const bbox = {
              southWest: paddingTestData.bbox.slice(0, 2),
              northEast: paddingTestData.bbox.slice(2),
              padding: paddingTestData.padding
            };

            const unique = [];
            _.times(100, () => {

              const coordinates = generateCoordinates({ bbox });
              expect(coordinates).to.be.an('array');
              expect(coordinates).to.have.lengthOf(2);
              expect(coordinates[0]).to.be.a('number');
              expect(coordinates[0]).to.be.at.least(paddingTestData.effectiveBbox[0]);
              expect(coordinates[0]).to.be.at.most(paddingTestData.effectiveBbox[2]);
              expect(coordinates[1]).to.be.a('number');
              expect(coordinates[1]).to.be.at.least(paddingTestData.effectiveBbox[1]);
              expect(coordinates[1]).to.be.at.most(paddingTestData.effectiveBbox[3]);

              const fingerprint = coordinates.join(',');
              if (unique.indexOf(fingerprint) < 0) {
                unique.push(fingerprint);
              }
            });

            // Check that at least 90% of the coordinates are different
            // (we can't be 100% sure that they all will be).
            expect(unique).to.have.lengthOf.at.least(90);
          });
        });

        // Check that invalid padding formats are not accepted.
        [
          { bbox: [ 10, 20, 20, 30 ], padding: 'foo', message: 'Padding must be an array or a number, got string' },
          { bbox: [ 10, 20, 20, 30 ], padding: -2, message: 'Padding must be zero or a positive number, got -2' },
          { bbox: [ 10, 20, 20, 30 ], padding: [], message: 'Padding array must have 1 to 4 elements, got 0' },
          { bbox: [ 10, 20, 20, 30 ], padding: [ 1, 2, 3, 4, 5 ], message: 'Padding array must have 1 to 4 elements, got 5' },
          { bbox: [ 10, 20, 20, 30 ], padding: [ 2, 3, 'bar' ], message: 'Padding array must contain only numbers, got [number,number,string]' },
          { bbox: [ 10, 20, 20, 30 ], padding: [ 2, -10, 3 ], message: 'Padding array must contain only zeros or positive numbers, got [2,-10,3]' },
        ].forEach(paddingTestData => {
          it(`should not accept invalid padding ${JSON.stringify(paddingTestData.padding)}`, () => {

            const bbox = {
              southWest: paddingTestData.bbox.slice(0, 2),
              northEast: paddingTestData.bbox.slice(2),
              padding: paddingTestData.padding
            };

            expect(() => generateCoordinates({ bbox })).to.throw(paddingTestData.message);
          });
        });

        // Check that overflow due to padding is not accepted.
        [
          {
            bbox: [ 10, 20, 20, 30 ],
            padding: [ 5, 4, 6, 3 ],
            message: 'Padding [5,4,6,3] for bounding box [10,20,20,30] would cause minimum latitude 26 to be greater than the maximum 25'
          },
          {
            bbox: [ 10, 20, 20, 30 ],
            padding: [ 4, 5, 3, 6 ],
            message: 'Padding [4,5,3,6] for bounding box [10,20,20,30] would cause minimum longitude 16 to be greater than the maximum 15'
          },
          {
            bbox: [ 10, 20, 20, 30 ],
            padding: [ 200, 0, 0, 0 ],
            message: 'Padding [200,0,0,0] for bounding box [10,20,20,30] would cause minimum latitude 20 to be greater than the maximum -170'
          },
          {
            bbox: [ 10, 20, 20, 30 ],
            padding: [ 0, 0, 0, 100 ],
            message: 'Padding [0,0,0,100] for bounding box [10,20,20,30] would cause minimum longitude 110 to be greater than the maximum 20'
          }
        ].forEach(paddingTestData => {
          it(`should not accept a padding of ${JSON.stringify(paddingTestData.padding)} for bounding box ${JSON.stringify(paddingTestData.bbox)} due to overflow`, () => {

            const bbox = {
              southWest: paddingTestData.bbox.slice(0, 2),
              northEast: paddingTestData.bbox.slice(2),
              padding: paddingTestData.padding
            };

            expect(() => generateCoordinates({ bbox })).to.throw(paddingTestData.message);
          });
        });
      });
    })
  });
});
