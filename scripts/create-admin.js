const valib = require('valib');

const User = require('../server/models/user');
const Script = require('./script');

/**
 * Script to create an admin user.
 *
 * The `$ADMIN_EMAIL` and `$ADMIN_PASSWORD` environment variables must be set.
 *
 * You may use this script to create an admin user when first deploying the
 * application in production.
 *
 *     $> ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=test npm run create-admin
 *
 * @class
 * @memberof module:scripts
 */
class CreateAdminScript extends Script {

  /**
   * Runs the script.
   */
  async run() {

    // Take input from the environment variables.
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.adminPassword = process.env.ADMIN_PASSWORD;

    if (!valib.String.isEmailLike(this.adminEmail)) {
      throw new Error('$ADMIN_EMAIL is required and must be a valid e-mail');
    } else if (!this.adminPassword || !this.adminPassword.trim().length) {
      throw new Error('$ADMIN_PASSWORD is required and cannot be blank');
    }

    // Check if an admin with that e-mail already exists.
    this.existingAdmin = await new User({
      email: this.adminEmail
    }).fetch();

    // If not, create the user.
    if (!this.existingAdmin) {
      this.createdAdmin = await new User({
        active: true,
        roles: [ 'admin' ],
        email: this.adminEmail,
        password: this.adminPassword
      }).save();
    }
  }

  /**
   * Logs a message indicating whether the admin user was created or already exists.
   */
  onSuccess() {
    if (this.createdAdmin) {
      this.logger.info(`Admin user ${this.createdAdmin.get('email')} successfully created`);
    } else {
      this.logger.info(`Admin user ${this.existingAdmin.get('email')} already exists`);
    }
  }
}

const script = new CreateAdminScript();
script.autoRun();

module.exports = script;
