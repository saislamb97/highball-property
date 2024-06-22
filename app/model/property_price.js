'use strict'

const moment = require("moment");

module.exports = app => {
  const { STRING, DATE, DATEONLY, ENUM, DECIMAL, Op } = app.Sequelize;
  const PropertyPrice = app.model.define('property_price', {
    date: {
      type: DATEONLY, // !DATE will be datetime
      get() {
        return moment(this.getDataValue('date')).format('YYYY-MM-DD')
      }
    },
    price: DECIMAL(38,2),
    status_updated: DATE,
    available_status: {
      type: ENUM,
      values: ['AVAILABLE', 'RESERVED', 'OCCUPIED']
    },
  }, {
    timestamps: false,
    tableName: 'property_prices',
    hooks: {
      beforeCreate: (record, options) => {
        record.status_updated = moment().toDate();
      },
      beforeUpdate: (record, options) => {
        if (record._previousDataValues.available_status !== record.dataValues.available_status) {
          record.dataValues.status_updated = moment().toDate();
        }
      }
    }
  });

  PropertyPrice.getList = function ({ dateStart, dateEnd, date, month, ...params }) {
    const options = {}
    if (Array.isArray(date)) {
      params.date = {
        [Op.in]: date.map(t => moment(t).format('YYYY-MM-DD'))
      }
    }
    if (dateStart && !dateEnd) {
      params.date = {
        [Op.gte]: moment(dateStart).format('YYYY-MM-DD') // >=
      }
    }
    if (dateEnd && !dateStart) {
      params.date = {
        [Op.lte]: moment(dateEnd).format('YYYY-MM-DD') // <=
      }
    }
    if (dateStart && dateEnd && dateStart !== dateEnd) {
      params.date = {
        [Op.between]: [
          moment(dateStart).format('YYYY-MM-DD'),
          moment(dateEnd).format('YYYY-MM-DD')
        ]
      }
    }
    if (dateStart && dateStart === dateEnd) {
      params.date = moment(dateStart).format('YYYY-MM-DD')
    }
    if (month) {
      const monthDate = moment(month + '-01').clone();
      params.date = {
        [Op.between]: [
          monthDate.format('YYYY-MM-01'),
          monthDate.set({ date: monthDate.daysInMonth() }).format('YYYY-MM-DD'),
        ]
      }
    }
    if (Array.isArray(params.property_id)) {
      params.property_id = {
        [Op.in]: params.property_id
      }
    }
    
    return this.findAll({
      where: params,
      ...options,
    })
  }

  PropertyPrice.getCount = function (params = {}) {
    return this.count({ where: params })
  }
  // static methods
  PropertyPrice.register = async function (fields) {
    return await this.create(fields);
  }

  PropertyPrice.queryPropertyPrice = async function(params, exclude = ['']) {
    return await this.findOne({
      where: params,
      attributes: {
        exclude: exclude.join(',')
      }
    })
  }

  PropertyPrice.updateByPk = function(params, id) {
    const cond = { id }
    if (Array.isArray(id)) {
      cond.id = { [Op.in]: id }
    }
    return this.update(params, { where: cond, individualHooks: true })
  }

  PropertyPrice.getListWithCount = function ({ available_status }) {
    return this.findAll({
      where: { available_status },
      include: [{
        model: app.model.Property,
        attributes: []
      }],
      attributes: [
        'property_id',
        [app.Sequelize.fn('COUNT', app.Sequelize.col('property_price.id')), 'count']
      ],
      group: ['property_price.property_id']
    });
  };

  PropertyPrice.updateStatusToOccupied = async function(property_id, date_start, date_end) {
    await this.update(
      { available_status: 'OCCUPIED' },
      {
        where: {
          property_id,
          date: {
            [Op.between]: [date_start, date_end]
          }
        }
      }
    );
  };
  
  PropertyPrice.associate = function () { 
    this.belongsTo(app.model.Property, {
      foreignKey: {
        name: 'property_id',
        allowNull: false
      },
    })
  }

  return PropertyPrice;
};