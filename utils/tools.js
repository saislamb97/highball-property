'use strict';
const crypto = require('crypto');
const qs = require('querystring');

module.exports = {
  /**
   * 反序列化
   * @param {*} data 
   * @param {boolean} catchReturnFalse 
   * @returns {*} 解码失败返回false
   */
  safeDecode(data, catchReturnFalse = false) {
    try {
      if (typeof data === 'object' || typeof data === 'number' || data == undefined) {
        return data;
      }
      if (typeof data === 'string') {
        data = decodeURIComponent(data)
      }
      const newData = JSON.parse( data );
      return newData
    } catch (e) {
      console.warn('safeDecode failed', e)
      if (catchReturnFalse) {
        return false;
      }
      return data
    }
  },

  
  /**
   * 延迟执行
   * @param {number} time 
   */
  delay(time = 0) {
    if (time < 0) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      const t = setTimeout(_ => {
        resolve();
        // clearTimeout(t)
      }, time)
    })
  },


  /**
   * hash256
   * @param {object} params 
   * @returns 
   */
  sha256(params = {}) {
    const hash = crypto.createHash('sha256');
    const sortedParams = {};
    Object.keys(params).sort().forEach(key => {
      sortedParams[key] = params[key] && typeof params[key] === 'object'
        ? JSON.stringify(params[key])
        : params[key];
    });
    const str = qs.stringify(sortedParams);
    hash.update(str);
    return hash.digest('hex');
  }

  

}