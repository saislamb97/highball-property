'use strict'

module.exports = app => {
  const { INTEGER, DOUBLE } = app.Sequelize;
  const PropertyImage = app.model.define('property_image', {
    property_model_id: INTEGER,
    images_id: INTEGER
  }, {
    timestamps: false,
    prrmaryKey: false,
    tableName: 'properties_images' 
  });
  // static methods
  PropertyImage.register = async function (fields) {
    return await this.create(fields);
  }

  PropertyImage.getList = async function({ paginate, ...params }) {
    if (paginate) {
      return this.findAndCountAll({
        where: params,
        ...paginate
      })
    }
    return this.findAll({ where: params })
  }

  PropertyImage.updateByPk = function(params, id) {
    return this.update(params, { where: { id } })
  }

  PropertyImage.associate = function () { 

    app.model.Image.belongsToMany(app.model.Property, { 
      foreignKey: {
        name: 'images_id',
        allowNull: false
      },
      otherKey: 'property_model_id',
      through: PropertyImage,
      onDelete: 'RESTRICT', 
      onUpdate: 'RESTRICT',
    })
    app.model.Property.belongsToMany(app.model.Image, {
      foreignKey: {
        name: 'property_model_id',
        allowNull: false
      },
      otherKey: 'images_id',
      through: PropertyImage,
      onDelete: 'RESTRICT', 
      onUpdate: 'RESTRICT',
    })
  }

  return PropertyImage;
};