'use strict';

const moment = require('moment')

const cumstomValidators = app => {
  app.validator.addRule('backend_role', (rule, value) => {
    const roles = ['ADMIN']
    if (Array.isArray(value)) {
      if (roles.sort().join() !== value.sort().join() || !roles.join().includes(value.join())) {
        return `role must be ${JSON.stringify(roles)}`
      }
    }
    else if (!roles.includes(value)) {
      return "role must be 'ADMIN'"
    }
  })
  // number or array
  app.validator.addRule('number_or_array', (rule, value) => {
    if (!(typeof value === 'number' || Array.isArray(value))) {
      return 'must be number or array'
    }
  })
  app.validator.addRule('date', (rule, value) => {
    if (!moment(value).isValid()) {
      return 'must be date'
    }
  })
  
}

module.exports = cumstomValidators