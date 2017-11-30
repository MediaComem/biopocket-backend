const db = require('../db');

const proto = db.bookshelf.Model.prototype;

/**
 * Abstract database model.
 *
 * @class
 * @extends bookshelf.Model
 */
const Abstract = db.bookshelf.Model.extend({
  initialize: function() {
    proto.initialize.apply(this, arguments);

    // Workaround (see https://github.com/tgriesser/bookshelf/issues/507#issuecomment-99634467)
    this.on('saving', (model, attrs, options) => {
      if (options.method === 'insert') {
        Object.defineProperty(options.query._single, 'returning', {
          get() { return '*'; },
          set() { return '*'; },
          configurable: true,
          enumerable: true,
          writeable: true,
        });
      } else {
        options.query.returning('*');
      }
    });

    // Workaround (see https://github.com/tgriesser/bookshelf/issues/507#issuecomment-99634467)
    this.on('saved', (model, attrs, options) => {
      if (options.method === 'insert') {
        model.set(model.parse(model.id));
      } else {
        const id = model.get(model.idAttribute);
        if (id) {
          const attr = attrs.find(attr => attr.id === id);
          if (attr) {
            model.set(model.parse(attr));
          }
        }
      }
    });
  }
});

module.exports = Abstract;
