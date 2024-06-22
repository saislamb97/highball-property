'use strict';

const { plus, minus } = require('../../utils/money');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize'); // Add this line

const Controller = require('egg').Controller;
const bookings_rules = {
  showRule: {
    id: { type: 'string', required: true }
  },
  createRule: {
    property_id: { type: 'int', required: true },
    date_start: { type: 'date', required: true },
    date_end: { type: 'date', required: true },
  }
}

class BookingsController extends Controller {

  // get /bookings
  async index() {
    const ctx = this.ctx
    const { ...params } = ctx.request.query;
    
    ctx.body = await ctx.model.Booking.getList(params)
  }

  // get /bookings/:id
  async show() {
    const ctx = this.ctx
    ctx.validate(bookings_rules.showRule, ctx.params)

    const id = ctx.params.id;

    if (['booking_status', 'check_in_status'].includes(id)) {
      return ctx.body = ctx.model.Booking.rawAttributes[id]?.values || []
    }
    if (id === 'count') {
      return ctx.body = await ctx.model.Booking.getCount(ctx.request.query)
    }
    if (+id) {
      const news = await ctx.model.Booking.queryBooking({
        id
      })
      return ctx.body = news
    }
    
    ctx.body = null
  }

  // post /bookings
  async create() {
    const ctx = this.ctx
    ctx.validate(bookings_rules.createRule)
    const { property_id, date_start, date_end, total_price = 0, discount = 0, tax_fee = 0, check_in_status = 'NOT_CHECKED_IN', ...params } = ctx.request.body;

    const prices = await ctx.model.PropertyPrice.findAll({
      where: {
        property_id,
        date: {
          [Op.between]: [date_start, date_end],
        },
        available_status: 'AVAILABLE'
      }
    });
  
    if (!prices.length) {
      return ctx.throw(422, 'No available property prices for the selected dates');
    }
  
    const dbTotalPrice = prices.reduce((sum, p) => plus(sum, p.price), 0);

    console.log(dbTotalPrice);

    if (dbTotalPrice !== +total_price) {
      return ctx.throw(412, 'Prices have been updated, please reselect dates');
    }

    const dev = await ctx.model.Booking.register({
      property_id, 
      date_start,
      date_end,
      total_price,
      booking_status: 'CONFIRMED',
      check_in_status,
      ...params
    })

    const payment = await ctx.model.Payment.register({
      amount: total_price,
      discount,
      tax_fee,
      payment_status: 'PAID',
      booking_id: dev.id,
      property_id,
    })

    dev.setDataValue('payment', payment.dataValues)
    // Update PropertyPrice available_status to OCCUPIED
    await ctx.model.PropertyPrice.updateStatusToOccupied(property_id, date_start, date_end);

    ctx.body = dev
    ctx.status = 201
  }

  // put /bookings/:id
  async update() {
    const ctx = this.ctx
    ctx.validate(bookings_rules.showRule, ctx.params)
    const { ...params } = ctx.request.body;
    delete params.id;
    await ctx.model.Booking.updateByPk(params, ctx.params.id)
    ctx.status = 201
  }

  // delete /bookings/:id
  async destroy() {
    const ctx = this.ctx
    ctx.validate(bookings_rules.showRule, ctx.params)
    await ctx.model.Booking.destroy({
      where: {
        id: ctx.params.id
      }
    })
    ctx.status = 201

  }
}

module.exports = BookingsController;