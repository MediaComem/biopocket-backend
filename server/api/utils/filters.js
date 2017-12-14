/**
 * @module server/api/utils/filters
 */

/**
 * Modifies a database query so that it returns only records with a `geometry`
 * that is inside the specified bounding box.
 *
 *     const { bbox } = require('../utils/filters');
 *
 *     let query = new MyModelWithGeometry();
 *
 *     query = bbox(query, '10,20,30,40');
 *
 * @param {Query} query - A Bookshelf database query.
 * @param {string} bboxString - A bounding box string (4 comma-separated numbers).
 * @returns {Query} The updated query.
 */
exports.bbox = function(query, bboxString) {

  const bbox = bboxString.split(',').map(value => parseFloat(value));

  const southWest = [ bbox[0], bbox[1] ];
  const southEast = [ bbox[2], bbox[1] ];
  const northEast = [ bbox[2], bbox[3] ];
  const northWest = [ bbox[0], bbox[3] ];

  const polygon = `POLYGON((${
    [
      southWest.join(' '),
      southEast.join(' '),
      northEast.join(' '),
      northWest.join(' '),
      southWest.join(' ')
    ].join(', ')
  }))`;

  return query.query(builder => builder.whereRaw(`ST_Within(geometry, ST_GeomFromText('${polygon}', 4326))`));
};
