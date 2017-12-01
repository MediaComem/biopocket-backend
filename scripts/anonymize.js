const config = require('../config');
const Script = require('./script');
const User = require('../server/models/user');

if (config.env != 'development') {
  throw new Error('This script should only be run during development');
}

/**
 * Script to anonymize production data.
 *
 * This script changes the passwords of all user accounts to "test".
 *
 *     $> npm run anonymize
 *
 * @class
 * @memberof module:scripts
 */
class AnonymizeScript extends Script {
  async run() {
    const users = await new User().fetchAll();

    await this.db.bookshelf.transaction(() => {
      return Promise.all(users.map(user => {
        return user.save('password', 'test', {
          patch: true
        });
      }));
    });
  }
}

const script = new AnonymizeScript();
script.autoRun();

module.exports = script;
