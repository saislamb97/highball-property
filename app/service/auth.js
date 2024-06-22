'use strict';
const Service = require('egg').Service;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @docs https://github.com/auth0/node-jsonwebtoken
 */
class AuthService extends Service {
  /**
   * generator jwt token
   * @param {object} data user data
   * @param {string|number} expiresIn <= 0 not expires
   * @return {string} token
   */
  async sign(data, expiresIn = '7d') {
    const token = jwt.sign(data, process.env.SECRET_KEY, {
      ...(expiresIn <= 0 ? {} : { expiresIn }),
      algorithm: 'HS256'
    })
    return token
  }

  /**
   * decode jwt token
   */
  decode(token) {
    token = (token || this.ctx.request.header['authorization'] || this.ctx.request.header['Authorization']).replace('Bearer ', "");
    try {
      return jwt.verify(token, process.env.SECRET_KEY)
    } catch (e) {
      this.logger.error(e)
      return null;
    }
  }

  /**
   * generator hashed passowrd
   * @param {string} password 
   * @returns {string} hased password
   */
  hashPassword(password) {
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password, salt)
  }

  /**
   * compare in password and db hashed password
   * @param {string} password used pwd
   * @param {string} hashedPassword db user.password
   * @returns {bool} 
   */
  comparePassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword)
  }

}

module.exports = AuthService;