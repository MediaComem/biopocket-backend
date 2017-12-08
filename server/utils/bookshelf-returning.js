module.exports = bookshelf => {

  const proto = bookshelf.Model.prototype;

  bookshelf.Model = bookshelf.Model.extend({
    returningProperties: '*',

    constructor: function() {
      proto.constructor.apply(this, arguments);

      // Workaround (see https://github.com/tgriesser/bookshelf/issues/507#issuecomment-99634467)
      this.on('saving', (model, attrs, options) => {
        if (options.method === 'insert') {
          const returningProperties = this.returningProperties;
          Object.defineProperty(options.query._single, 'returning', {
            get() { return returningProperties; },
            set() { return returningProperties; },
            configurable: true,
            enumerable: true,
            writeable: true,
          });
        } else {
          options.query.returning.apply(options.query, Array.isArray(this.returningProperties) ? this.returningProperties : [ this.returningProperties ]);
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
};
