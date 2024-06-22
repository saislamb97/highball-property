'use strict';
class AppBootHook {
  constructor(app) {
    this.app = app;
  }

  configWillLoad() {
    // Ready to call configDidLoad,
    // Config, plugin files are referred,
    // this is the last chance to modify the config.
  }

  configDidLoad() {
    // Config, plugin files have been loaded.
  }

  async didLoad() {
    // All files have loaded, start plugin here.
  }

  async willReady() {
    await this.app.model.sync({ alter: true })
    require('events').EventEmitter.defaultMaxListeners = 50;
    const ctx = this.app.createAnonymousContext();
  }

  async didReady() {
    // Worker is ready, can do some things
    // don't need to block the app boot.
    require('./config/validator')(this.app)
  }

  async serverDidReady() {
    // Server is listening.
  }

  async beforeClose() {
    // Do some thing before app close.
  }
}

module.exports = AppBootHook;
