const Script = require('./script');
const User = require('../server/models/user');
const valib = require('valib');

class CreateAdminScript extends Script {
  run() {
    return Promise
      .resolve()
      .then(() => this.validateInput())
      .then(() => this.loadExistingAdmin())
      .then(() => this.createAdmin());
  }

  validateInput() {

    // Take input from environment variables
    this.adminEmail = process.env.ADMIN_EMAIL;
    this.adminPassword = process.env.ADMIN_PASSWORD;

    if (!valib.String.isEmailLike(this.adminEmail)) {
      throw new Error('$ADMIN_EMAIL is required and must be a valid e-mail');
    } else if (!this.adminPassword || !this.adminPassword.trim().length) {
      throw new Error('$ADMIN_PASSWORD is required and cannot be blank');
    }
  }

  loadExistingAdmin() {
    return new User({
      email: this.adminEmail
    }).fetch().then(admin => {
      this.existingAdmin = admin;
    });
  }

  createAdmin() {
    if (this.existingAdmin) {
      return;
    }

    return new User({
      active: true,
      roles: [ 'admin' ],
      email: this.adminEmail,
      password: this.adminPassword
    }).save().then(admin => {
      this.createdAdmin = admin;
    });
  }

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
