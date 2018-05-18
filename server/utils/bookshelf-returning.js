module.exports = bookshelf => {

  const proto = bookshelf.Model.prototype;

  bookshelf.Model = bookshelf.Model.extend({
    returningProperties: '*',

    constructor(...args) {
      proto.constructor.apply(this, args);

      // Workaround (see https://github.com/tgriesser/bookshelf/issues/507#issuecomment-99634467)
      this.on('saving', (model, attrs, options) => {
        if (options.method === 'insert') {
          const returningProperties = this.returningProperties;
          Object.defineProperty(options.query._single, 'returning', {
            get() {
              return returningProperties;
            },
            set() {
              return returningProperties;
            },
            configurable: true,
            enumerable: true,
            writeable: true
          });
        } else {
          options.query.returning(this.returningProperties);
        }
      });

      // Workaround (see https://github.com/tgriesser/bookshelf/issues/507#issuecomment-99634467)
      this.on('saved', (model, attrs, options) => {
        if (options.method === 'insert') {
          model.set(model.parse(model.id));
          return;
        }

        const id = model.get(model.idAttribute);
        if (id) {
          const attribute = attrs.find(attr => attr.id === id);
          if (attribute) {
            model.set(model.parse(attribute));
          }
        }
      });
    }
  });
};
