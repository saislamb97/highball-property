'use strict';

const Controller = require('egg').Controller;
const properties_rules = {
  showRule: {
    id: { type: 'string', required: true }
  },
  createRule: {
    property_name: { type: 'string', required: true },
    owner_id: { type: 'number', required: true },
  }
}

class PropertiesController extends Controller {

  // get /properties
  async index() {
    const ctx = this.ctx
    const params = ctx.request.query
    ctx.body = await ctx.model.Property.getList(params)
  }

  // get /properties/:id
  async show() {
    const ctx = this.ctx
    ctx.validate(properties_rules.showRule, ctx.params)
    
    const id = ctx.params.id;

    if (['view_type', 'furnish_type'].includes(id)) {
      return ctx.body = ctx.model.Property.rawAttributes[id].values
    }
    if (id === 'count') {
      return ctx.body = await ctx.model.Property.getCount(ctx.request.query)
    }
    if (+id) {
      const property = await ctx.model.Property.queryProperty({
        id: +id
      })
      return ctx.body = property
    }
    
    return null
  }

  // post /properties
  async create() {
    const ctx = this.ctx
    ctx.validate(properties_rules.createRule)
    const { ...params } = ctx.request.body;
    const dev = await ctx.model.Property.register(params)
    ctx.body = dev
    ctx.status = 201
  }

  // put /properties/:id
  async update() {
    const ctx = this.ctx
    ctx.validate(properties_rules.showRule, ctx.params)
    const { imageIds, ...params } = ctx.request.body;
    delete params.id;
    
    const id = ctx.params.id
    await ctx.model.Property.updateByPk(params, ctx.params.id)

    if (Array.isArray(imageIds)) {
      const currentImageIds = await ctx.model.Image.getList({ property_id: id }).then(res => res.map(t => t.id))

      const deleting = currentImageIds.filter(id => !imageIds.includes(id));
      const newing = imageIds.filter(id => !currentImageIds.includes(id));
      // - remove old, update new
      if (deleting.length) {
        await ctx.model.Image.removeById(deleting)
      }
      if (newing.length) {
        await ctx.model.Image.updateByPk({
          property_id: id
        }, newing)
      }
    }
    ctx.status = 201
  }

  // delete /properties/:id
  async destroy() {
    const ctx = this.ctx
    ctx.validate(properties_rules.showRule, ctx.params)
    await ctx.model.Property.destroy({
      where: {
        id: ctx.params.id
      }
    })
    ctx.status = 201

  }
}

module.exports = PropertiesController;
