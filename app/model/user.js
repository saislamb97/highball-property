'use strict'
const moment = require("moment");
const { safeDecode } = require("../../utils/tools");

module.exports = app => {
  const { STRING, INTEGER, DATE, ENUM, Op, fn, literal } = app.Sequelize;
  const User = app.model.define('user', {
    username: {
      allowNull:false,
      type: STRING(255), 
    },
    email: {
      type: STRING(255),
      allowNull: false
    },
    password: {
      allowNull:false,
      type: STRING(255)
    },
    full_name: STRING(255),
    gender: {
      type: ENUM,
      values:['MALE','FEMALE']
    },
    phone: STRING(255),
    role: {
      type: ENUM,
      values:['ADMIN','USER']
    },
    created_at: {
      type: DATE,
      allowNull: false
    }
  }, {
    indexes: [{ unique: true, fields: ["username"] }],
    timestamps: false,
    tableName: 'users',
    hooks: {
      beforeValidate: (record, options) => {
        if (record.isNewRecord) {
          record.dataValues.created_at = moment();
        }
      }, 
    }
  });

  User.getList = async function({ 
    keyword, username = '', full_name = '', email = '', phone = '',
    paginate, ...params 
  }) {
    const otherParams = { username, full_name, email, phone }
    if (keyword) {
      params = literal(`
        CONCAT(${ Object.keys(otherParams).join(', ') }) LIKE '%${keyword}%'
        ${ Object.keys(params).length ? 'AND' : ''} ${ Object.entries(params).map(kv => kv.join(' = ')).join(' AND ') }
      `)
    } else {
      for (let k in otherParams) {
        if (otherParams[k]) {
          params[k] = otherParams[k]
        }
      }
    }
    const queryProps = {
      distinct: true,
      where: params,
    }
    if (paginate) {
      return this.findAndCountAll({
        where: params,
        exclude: ['password'],
        ...queryProps,
        ...paginate
      })
    }
    return this.findAll({ where: params, exclude: ['password'], })
  }
  // static methods
  User.register = async function (fields) {
    return await this.create(fields);
  }

  User.queryUser = async function(params, exclude = ['password']) {
    return await this.findOne({
      where: params,
      attributes: {
        exclude: exclude.join(',')
      },
    })
  }

  User.getCount = function ({ role, ...params }) {
    let options = {}
    if (role) {
      role = safeDecode(role)
      if (Array.isArray(role)) {
        params.role = {
          [Op.in]: role
        }
        options = {
          attributes: [
            'role',
            [fn('COUNT', 'id'), 'count']
          ],
          group: ['role'],
        }
      }
      else {
        params.role = role
      }
    }
    return this.count({ where: params, ...options, logging: console.log }).then(data => {
      if (Array.isArray(data)) {
        var res = {}
        data.forEach(t => {
          if (t.role) {
            res[t.role] = t.count
          }
        })
        return res
      }
      return data
    })
  }

  User.updateByPk = function(params, id) {
    return this.update(params, { where: { id } })
  }

  return User;
};