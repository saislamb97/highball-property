'use strict';

const Controller = require('egg').Controller;
const payments_rules = {
  showRule: {
    id: { type: 'string', required: true }
  },
}

class PaymentsController extends Controller {

  // get /payments
  async index() {
    const ctx = this.ctx
    const { ...params } = ctx.request.query;
    
    ctx.body = await ctx.model.Payment.getList(params)
  }
  
  // get /payments/:id
  async show() {
    const ctx = this.ctx
    ctx.validate(payments_rules.showRule, ctx.params)

    const id = ctx.params.id;

    if (['payment_status'].includes(id)) {
      return ctx.body = ctx.model.Payment.rawAttributes[id]?.values || []
    }
    if (id === 'count') {
      return ctx.body = await ctx.model.Payment.getCount(ctx.request.query)
    }
    if (+id) {
      const news = await ctx.model.Payment.queryPayment({
        id
      })
      return ctx.body = news
    }
    
    ctx.body = null
  }

  // post /payments
  async create() {
    const ctx = this.ctx;
    ctx.validate(payments_rules.createRule);
    const paymentData = ctx.request.body;
    const newPayment = await ctx.model.Payment.register(paymentData);
    ctx.status = 201;
    ctx.body = newPayment;
  }

   // put /payments/:id
   async update() {
    const ctx = this.ctx
    ctx.validate(payments_rules.showRule, ctx.params)
    delete ctx.request.body.id
    await ctx.model.Payment.updateByPk(ctx.request.body, ctx.params.id)

    ctx.status = 201
  }

  // delete /payments/:id
  async destroy() {
    const ctx = this.ctx
    ctx.validate(payments_rules.showRule, ctx.params)
    await ctx.model.Payment.destroy({
      where: {
        id: ctx.params.id
      }
    })
    ctx.status = 201

  }
}

module.exports = PaymentsController