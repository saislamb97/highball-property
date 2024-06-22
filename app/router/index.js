'use strict';
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller, middleware } = app;
  
  router.resources('users', '/api/users', middleware.authenticate(), controller.users);
  router.post('/api/users/login', controller.users.login);  
  router.post('/api/users/register', controller.users.register);
  router.resources('properties', '/api/properties', middleware.authenticate(), controller.properties);
  router.get('/api/property/prices/status_count', middleware.authenticate(), controller.propertyPrices.getStatusCount);
  router.resources('propertyPrice', '/api/property/prices', middleware.authenticate(), controller.propertyPrices);
  router.resources('bookings', '/api/bookings', middleware.authenticate(), controller.bookings);
  router.resources('payments', '/api/payments', middleware.authenticate(), controller.payments);
  router.post('/api/tools/upload', middleware.authenticate(), controller.tools.upload);
  router.delete('/api/tools/deleteFile', middleware.authenticate(), controller.tools.deleteFile);
  router.get('/image/:id', controller.tools.image);
};
