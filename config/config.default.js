'use strict';
require('dotenv').config();
const path = require('path');

module.exports = appInfo => {
  const config = exports = {
    static: { // Configure static file requests
      prefix: '/',
      dir: path.join(__dirname, '../public/')
    },
    
    view: {
      defaultViewEngine: 'nunjucks',
      mapping: {
        '.html': 'nunjucks',
      },
    },
    sequelize: {
      dialect: process.env.DATABASE_DIALECT, // support: mysql, mariadb, postgres, mssql
      database: process.env.DATABASE_NAME,
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      logging: false,
      timezone: '+08:00',
      dialectOptions: {
        decimalNumbers: true, // decimal return number (default string)
      },
      pool: {
        max: 500,
        min: 0,
        idle: 10000,
        acquire: 30000,
      },
      define: {
        underscored: false,
      },
    },
    security: {
      csrf: {
        // headerName: 'x-csrf-token', 
        enable: false,
      },
    }
  };

  config.cluster = {
    listen: {
      path: '',
      port: +process.env.PORT,
      hostname: '0.0.0.0',
    }
  };
  // add your config here
  config.middleware = ['validateRequestParams', 'paginate'];

  return config;
};

