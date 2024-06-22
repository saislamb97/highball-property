const Decimal = require("decimal.js")
const c = require('ansi-colors');

/**
 * 钱加减操作
 */
module.exports = {
  /**
   * a + b
   * @param {number} a 
   * @param {number} b 
   * @return {number}
   */
  plus(a, b) {
    const _a = new Decimal(a);
    const _b = new Decimal(b);
    const res = Number(
      _a.plus(_b)
    )
    return res;
  },
  /**
   * a - b
   * @param {number} a 
   * @param {number} b 
   * @return {number}
   */
  minus(a, b) {
    const _a = new Decimal(a);
    const _b = new Decimal(b);
    const res = Number(
      _a.minus(_b)
    )
    return res
  },

  /**
   * a × b
   * @param {number} a 
   * @param {number} b 
   * @return {number}
   */
  mul(a, b) {
    if (a === 0 || b === 0) return 0;
    const _a = new Decimal(a);
    const _b = new Decimal(b);
    const res = Number(
      _a.mul(_b)
    )
    return res
  },

  /**
   * 整除 a ÷ b
   * @param {number} a 
   * @param {number} b 
   * @return {number}
   */
  div(a, b) {
    if (b === 0 || a === 0) return 0;
    const _a = new Decimal(a);
    const _b = new Decimal(b);
    const res = Number(
      _a.div(_b)
    )
    return res
  },

  /**
   * 返回 Decimal 实例
   * @param {number} a 
   * @return {object} decimal instance
   */
  m(a) {
    return new Decimal(a)
  }
}