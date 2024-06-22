'use strict';

const Controller = require('egg').Controller;
const moment = require("moment");
const { delay } = require('../../utils/tools');

const prices_rules = {
  showRule: {
    id: { type: 'string', required: true }
  },
  createRule: {
    property_id: { type: 'number_or_array', required: true },
    available_status: { type: 'string', required: true }
  }
}

class PropertyPricesController extends Controller {

  // get /property/prices
  async index() {
    const ctx = this.ctx;
    const { property_id, dateStart, dateEnd, date, month } = ctx.request.query;

    if (month && !/\d{4}-\d{2}/.test(month)) {
      return ctx.throw(422, 'invalid month, should be “YYYY-MM”');
    }

    if (date || dateStart || dateEnd) {
      for (let d of [date, dateStart, dateEnd].filter(Boolean)) {
        if (!moment(d).isValid()) {
          return ctx.throw(422, 'invalid date type');
        }
      }
    }

    ctx.body = await ctx.model.PropertyPrice.getList({
      property_id,
      dateStart,
      dateEnd,
      date,
      month,
    });
  }

  // get /property/prices/:id
  async show() {
    const ctx = this.ctx;
    ctx.validate(prices_rules.showRule, ctx.params);

    const id = ctx.params.id;

    if (['available_status'].includes(id)) {
      return ctx.body = ctx.model.PropertyPrice.rawAttributes[id].values;
    }
    if (id === 'count') {
      return ctx.body = await ctx.model.PropertyPrice.getCount(ctx.request.query);
    }
    if (+id) {
      const property = await ctx.model.PropertyPrice.queryPropertyPrice({
        id: +id
      });
      return ctx.body = property;
    }

    return null;
  }

  // get /property/prices/status_count
  async getStatusCount() {
    const ctx = this.ctx;
    const { available_status } = ctx.request.query;

    if (!available_status) {
      return ctx.throw(422, 'available_status is required');
    }

    try {
      const data = await ctx.model.PropertyPrice.getListWithCount({ available_status });
      ctx.body = data;
    } catch (error) {
      ctx.logger.error('Error fetching property prices with status:', error);
      ctx.throw(500, 'Internal server error');
    }
  }

  // post /property/prices
  async create() {
    const ctx = this.ctx;
    ctx.validate(prices_rules.createRule);

    const { ...params } = ctx.request.body;
        
    let price = params.price === "" || params.price === null ? null : +params.price;

    if (isNaN(price)) {
      return ctx.throw(422, 'invalid price');
    }

    if (!params.date || !params.date?.length) {
      return ctx.throw(422, 'invalid date');
    }

    const status_updated = moment().toDate();

    if (Array.isArray(params.date)) {
      return this.bulkCreate();
    }

    if (price !== "" || price !== null) {
      const dev = await ctx.model.PropertyPrice.register({ price: +price, available_status: params.available_status, ...params, status_updated });
      ctx.body = dev;
    }

    ctx.status = 201;
  }

  // post /property/prices/bulk
  async bulkCreate() {
    const ctx = this.ctx;
    const { date, property_id, available_status, ...params } = ctx.request.body;
    let price = params.price === "" || params.price === null ? null : +params.price;

    if (isNaN(price)) {
      return ctx.throw(422, 'invalid price');
    }

    const currentDates = await ctx.model.PropertyPrice.getList({ property_id, date });

    const olds = currentDates.filter(t => date.includes(t.date));
    const newDates = date.filter(d => !currentDates.find(t => t.date === d));

    const status_updated = moment().toDate();
    const data = [];
    // update olds
    if (olds?.length) {
      const [updatedCount] = await ctx.model.PropertyPrice.updateByPk({
        price,
        available_status,
        status_updated
      }, olds.map(t => t.id));

      if (updatedCount > 0) {
        data.push(
          ...olds.map(t => ({ ...t.toJSON(), price, available_status, status_updated }))
        );
      }
    }
    // create new
    if (newDates?.length) {
      const res = await ctx.model.PropertyPrice.bulkCreate(
        newDates.map(d => {
          if (price !== null) {
            const item = {
              date: moment(d).format('YYYY-MM-DD'),
              property_id,
              price: +price,
              available_status,
              status_updated
            };
            if (Array.isArray(property_id)) {
              return property_id.map(pid => {
                return {
                  ...item,
                  property_id: pid
                };
              });
            }
            if (typeof property_id === 'number') {
              return item;
            }
          }
        }).filter(Boolean).flat()
      );
      data.push(...res);
    }

    // return the new Data
    ctx.body = data;
  }

  // put /property/prices/:id
  async update() {
    const ctx = this.ctx;
    console.log(ctx.body);
    ctx.validate(prices_rules.showRule, ctx.params);
    const { imageIds, ...params } = ctx.request.body;
    delete params.id;

    const id = ctx.params.id;
    const status_updated = moment().toDate();
    await ctx.model.PropertyPrice.updateByPk({ ...params, available_status: params.available_status, status_updated }, ctx.params.id);

    ctx.status = 201;
  }

  // delete /property/prices/:id
  async destroy() {
    const ctx = this.ctx;
    ctx.validate(prices_rules.showRule, ctx.params);
    await ctx.model.PropertyPrice.destroy({
      where: {
        id: ctx.params.id
      }
    });
    ctx.status = 201;
  }
}

module.exports = PropertyPricesController;
