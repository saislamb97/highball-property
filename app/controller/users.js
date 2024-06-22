'use strict';

const Controller = require('egg').Controller;
const { Op } = require('sequelize')

const users_rules = {
  showRule: {
    id: { type: 'string', required: true }
  },
  loginRule: {
    email: { type: 'string', required: true },
    password: { type: 'string', required: true },
  },
  createRule: {
    username: { type: 'string', required: true },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true, min: 6 },
    role: { type: 'enum', required: true, values: ['ADMIN', 'USER'] },
  }
}

const moment = require('moment')

class UsersController extends Controller {

  // post /api/users/login
  async login() {
    const ctx = this.ctx
    ctx.validate(users_rules.loginRule);
    const { email, password, role } = ctx.request.body
    const useRole = { role }
    if (Array.isArray(role)) {
      useRole.role = {
        [Op.in]: role
      }
    }
    const user = await ctx.model.User.queryUser({
      [Op.or]: [
        { username: email, ...useRole },
        { email, ...useRole }
      ]
    }, []).then(u => u ? u.toJSON() : null);
    
    if (!user) {
      ctx.throw(404, 'user is not found')
    }
    if (!(ctx.service.auth.comparePassword(password, user.password))) {
      ctx.throw(412, 'password wrong')
    }

    delete user.password

    const token = await ctx.service.auth.sign(user);
    ctx.body = {
      user: user,
      token,
    }
  }

  async logout() {
    const {
      email
    } = this.ctx.request.body
    
    this.ctx.status = 200
  }

  // get /api/users
  async index() {
    const ctx = this.ctx
    const params = ctx.request.query
    
    ctx.body = await ctx.model.User.getList(params)
  }

  // get /users/:id
  async show() {
    const ctx = this.ctx;
    ctx.validate(users_rules.showRule, ctx.params);
  
    const id = ctx.params.id;
  
    if (['role', 'gender'].includes(id)) {
      return ctx.body = ctx.model.User.rawAttributes[id].values;
    }
    if (id === 'count') {
      return ctx.body = await ctx.model.User.getCount(ctx.request.query);
    }
    if (+id) {
      const user = await ctx.model.User.queryUser({
        id: +id
      });
      return ctx.body = user;
    }
  
    return null;
  }  

  // post /register
  async register() {
    const ctx = this.ctx;
    const { username, password, email, role, phone, full_name = '', gender } = ctx.request.body;
    ctx.validate(users_rules.createRule, ctx.request.body);

    const hashedPassword = ctx.service.auth.hashPassword(password);

    const existed = await ctx.model.User.count({ where: { username }});
    if (existed > 0) {
      return ctx.throw(412, 'username is existed')
    }
    const user = await ctx.model.User.create({
      username,
      email,
      password: hashedPassword,
      role,
      phone,
      full_name,
      gender,
    });

    delete user.dataValues.password;

    ctx.body = {
      user,
      token: await ctx.service.auth.sign(user.dataValues)
    };
    ctx.status = 201
  }

  // post /users
  async create() {
    const ctx = this.ctx
    ctx.validate(users_rules.createRule)
    const user = await ctx.model.User.register(ctx.request.body)
    user && delete user.dataValues.hashedPassword
    ctx.body = user
    ctx.status = 201
  }

  // put /users/:id
  async update() {
    const ctx = this.ctx
    ctx.validate(users_rules.showRule, ctx.params)
    delete ctx.request.body.id
    if (ctx.request.body.password) {
      ctx.request.body.password = ctx.service.auth.hashPassword(ctx.request.body.password)
    }
    await ctx.model.User.updateByPk(ctx.request.body, ctx.params.id)
    ctx.status = 201
  }

  // delete /users/:id
  async destroy() {
    const ctx = this.ctx
    ctx.validate(users_rules.showRule, ctx.params)
    await ctx.model.User.deleteByArgs({
      id: ctx.params.id
    })
    ctx.status = 201
  }

}

module.exports = UsersController;
