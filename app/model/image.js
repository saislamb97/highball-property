'use strict'
const path = require('path');
const moment = require("moment");

module.exports = app => {
  const { STRING, INTEGER, DATE, TINYINT, VIRTUAL, TEXT, ENUM, Op } = app.Sequelize;
  const Image = app.model.define('image', {
    image_index: {
      type: TINYINT(2),
      defaultValue: 0
    },
    image_url: {
      type: STRING(255),
      get() {
        const prefix = process.env.PREFIX_RESOURCE || '';
        return path.posix.join(prefix, `/image/${this.getDataValue('id')}`)
      }
    },
    image_data: TEXT,
    uploaded_at: DATE,
  }, {
    timestamps: false,
    tableName: 'images',
    hooks: {
      beforeCreate: (record, options) => {
        if (!record.dataValues.hasOwnProperty('uploaded_at')) {
          record.dataValues.uploaded_at = moment()
        }
      }, 
    },
  });
  
  // static methods
  Image.register = async function (fields) {
    return await this.create(fields);
  }

  Image.queryImage = async function(params, exclude = ['']) {
    return await this.findOne({
      where: params,
      attributes: {
        exclude: exclude.join(',')
      }
    })
  }

  Image.getList = async function(params = {}) {
    return this.findAll({
      where: params
    })
  }

  Image.updateByPk = function(params, id) {
    const cond = { id }
    if (Array.isArray(id)) {
      cond.id = { [Op.in]: id }
    }
    return this.update(params, { where: cond })
  }

  Image.removeById = function(id) {
    const cond = { id }
    if (Array.isArray(id)) {
      cond.id = { [Op.in]: id }
    }
    return this.destroy({ where: cond })
  }

  return Image;
};