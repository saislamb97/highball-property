'use strict'
const { safeDecode } = require('../../utils/tools')

module.exports = app => {
  const { STRING, INTEGER, DATE, ENUM, DOUBLE, Op } = app.Sequelize;
  const Property = app.model.define('property', {
    property_name: STRING(255),
    description: STRING(255),
    unit_number: STRING(255),
    number_of_rooms: INTEGER,
    number_of_parking: INTEGER,
    number_of_toilets: INTEGER,
    view_type: {
      type: ENUM,
      values:['KLCC','TRX','GOLF','CITY','OTHERS']
    },
    furnish_type:{
      type: ENUM,
      values:['FULL_FURNISHED','HALF_FURNISHED','NOT_FURNISHED']
    },
    posted_date:DATE,
  }, {
    timestamps: false,
    tableName: 'properties' 
  });
  // static methods
  Property.register = function ({ images, ...params }) {
    if (Array.isArray(images)) {
      return this.create({
        ...params,
        images
      }, {
        include: app.model.Image,
        attributes: {
          exclude: ['image_data']
        }
      })
    }
    return this.create(params);
  }
  Property.getList = async function({ paginate, keyword, ...params }) {
    if (keyword && !params.property_name) {
      params.property_name = {
        [Op.like]: `%${keyword}%`
      }
    }
    if (params.id) {
      params.id = safeDecode(params.id, true)
      if (!params.id) {
        return paginate ? { count: 0, rows: [] } : []
      }
      if (Array.isArray(params.id)) {
        params.id = {
          [Op.in]: params.id
        }
      }
    }
    if (paginate) {
      return this.findAndCountAll({
        distinct: true,
        where: params,
        include: [{
          model: app.model.User,
          as: 'owner'
        }, {
          model: app.model.Image,
          attributes: {
            exclude: ['image_data']
          }
        }],
        ...paginate
      })
    }
    return this.findAll({ 
      where: params, 
      include: [{
        model: app.model.User,
        as: 'owner'
      }]
    })
  }

  Property.queryProperty = async function(params, exclude = ['']) {
    return await this.findOne({
      where: params,
      attributes: {
        exclude: exclude.join(',')
      },
      include: [{
        model: app.model.User,
        as: 'owner'
      }, {
        model: app.model.Image,
        attributes: {
          exclude: ['image_data']
        }
      }]
    })
  }

  Property.updateByPk = async function({ images, ...params }, id) {
    if (Array.isArray(images)) {
      const property = await Property.findByPk(id)
      await property.setImages([])
      const newImages = await Promise.all(
        images.map(({ id: imageId, ...imageParams }) => 
          imageId
            ? app.model.Image.findByPk(imageId)
            : app.model.Image.create(imageParams)
        )
      )
      await property.addImages(newImages)
    }
    return Property.update(params, { where: { id } })
  }

  Property.getCount = function (params = {}) {
    return this.count({ where: params })
  }
  
  Property.associate = function () { 
    this.belongsTo(app.model.User, {
      foreignKey: {
        name: 'owner_id',
        allowNull: false
      },
      as: 'owner'
    })
  }

  return Property;
};
