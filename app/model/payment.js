'use strict'
const moment = require("moment");

module.exports = app => {
  const { STRING, DATE, ENUM, DECIMAL} = app.Sequelize;
  const Payment = app.model.define('payment', {
    amount: DECIMAL(38,2),
    discount: DECIMAL(38,2),
    tax_fee: DECIMAL(38,2),
    payment_status:{
      type: ENUM,
      values:['PENDING','PAID','CANCELLED']
    },
    created_at:DATE
  }, {
    timestamps: false,
    hooks: {
      beforeCreate: (record, options) => {
        record.dataValues.created_at = moment();
      }, 
    },
    tableName: 'payments' 
  });
  // static methods
  Payment.register = async function (fields) {
    return await this.create(fields);
  }

  Payment.getList = function ({ paginate, ...params }, exclude = []) {
    const queryProps = {
      distinct: true,
      where: params,
      include: [
        { model: app.model.Property, 
          include: {
            model: app.model.Image,
            attributes: {
              exclude: ['image_data']
            }
          }
        },
        { model: app.model.Booking },
      ],
      attributes: {
        exclude: exclude.join(',')
      }
    }
    if (paginate) {
      return this.findAndCountAll({
        ...queryProps,
        ...paginate
      })
    }
    return this.findAll(queryProps)
  }

  Payment.getCount = function (params = {}) {
    return this.count({ where: params })
  }

  Payment.queryPayment = async function(params, exclude = ['']) {
    return await this.findOne({
      where: params,
      include: [
        { model: app.model.Property, 
          include: {
            model: app.model.Image,
            attributes: {
              exclude: ['image_data']
            }
          }
        },
        { model: app.model.Booking },
      ],
      attributes: {
        exclude: exclude.join(',')
      }
    })
  }

  Payment.updateByPk = function(params, id) {
    return this.update(params, { where: { id } })
  }
  
  Payment.associate = function () { 
    this.belongsTo(app.model.Property, {
      foreignKey: {
        name: 'property_id',
        allowNull: false
      },
    })
    this.belongsTo(app.model.Booking, {
      foreignKey: {
        name: 'booking_id',
        allowNull: false
      },
    })
  }

  return Payment;
};