'use strict'
const moment = require('moment');
const { safeDecode } = require('../../utils/tools');

module.exports = app => {
  const { STRING, INTEGER, DATE, DATEONLY, ENUM, DECIMAL, Op, fn, literal } = app.Sequelize;
  const Booking = app.model.define('booking', {
    booking_date: {
      type: DATE,
      allowNull: false
    },
    date_start: {
      type: DATEONLY,
      allowNull: false
    },
    date_end: {
      type: DATEONLY,
      allowNull: false
    },
    total_price: {
      type: DECIMAL(38,2),
      allowNull: false
    },
    guest_email: STRING(255),
    guest_full_name: STRING(255),
    guest_mobile_no: STRING(255),
    number_of_guests: INTEGER,
    booking_status: {
      type: ENUM,
      values: ['PENDING', 'CONFIRMED', 'CANCELLED']
    },
    check_in_status: {
      type: ENUM,
      values: ['CHECKED_IN', 'CHECKED_OUT', 'NOT_CHECKED_IN']
    },
  }, {
    hooks: {
      beforeValidate: (record, options) => {
        if (record.isNewRecord && !record.dataValues.hasOwnProperty('booking_date')) {
          record.dataValues.booking_date = moment()
        }
      },
    },
    timestamps: false,
    tableName: 'bookings'
  });

  // Static methods
  Booking.register = async function (fields) {
    return await this.create(fields);
  }

  Booking.getList = async function({ 
    keyword, guest_email = '', guest_full_name = '', guest_mobile_no = '',
    paginate, ...params 
  }) {
    const include = [{
      model: app.model.Property,
      include: [{
        model: app.model.Image,
        attributes: {
          exclude: ['image_data']
        }
      }]
    }];
    const otherParams = { guest_email, guest_full_name, guest_mobile_no }
    if (keyword) {
      params = literal(`
        CONCAT(${ Object.keys(otherParams).join(', ') }) LIKE '%${keyword}%'
        ${ Object.keys(params).length ? 'AND' : ''} ${ Object.entries(params).map(kv => kv.join(' = ')).join(' AND ') }
      `);
    } else {
      for (let k in otherParams) {
        if (otherParams[k]) {
          params[k] = otherParams[k];
        }
      }
    }
    if (paginate) {
      return this.findAndCountAll({
        distinct: true,
        where: params,
        include,
        order: [['booking_date', 'DESC']],
        ...paginate,
      });
    }
    return this.findAll({ where: params, include });
  }

  Booking.queryBooking = async function(params, exclude = ['']) {
    return await this.findOne({
      where: params,
      include: [{
        model: app.model.Property,
        include: [{
          model: app.model.Image,
          attributes: {
            exclude: ['image_data']
          }
        }]
      }],
      attributes: {
        exclude: exclude.join(',')
      }
    });
  }

  Booking.getCount = function (params = {}) {
    let options = {};
    const types = ['booking_status', 'check_in_status'];
    types.forEach(t => {
      if (params[t]) {
        const decodeType = safeDecode(params[t]);
        if (Array.isArray(decodeType)) {
          params[t] = {
            [Op.in]: decodeType
          };
          options = {
            attributes: [
              t,
              [fn('COUNT', 'id'), 'count']
            ],
            group: [t],
          };
        }
      }
    });
    
    return this.count({ where: params, ...options, logging: console.log }).then(data => {
      if (Array.isArray(data)) {
        var res = {};
        types.forEach(t => {
          if (params[t]?.[Op.in]) {
            params[t][Op.in].forEach(p => {
              res[p] = data.find(d => d[t] === p)?.count ?? 0;
            });
          }
        });
        return res;
      }
      return data;
    });
  }

  Booking.updateByPk = function(params, id) {
    return this.update(params, { where: { id } });
  }
  
  Booking.associate = function () {
    this.belongsTo(app.model.Property, {
      foreignKey: {
        name: 'property_id',
        allowNull: false
      }
    });
  }

  return Booking;
};
