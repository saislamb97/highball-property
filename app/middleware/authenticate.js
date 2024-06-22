
module.exports = (options, app) => {
  return async function authenticate(ctx, next) {
    const token = ctx.request.header['authorization'] || ctx.request.header['Authorization'];
    if (!token) {
      return ctx.throw(401, 'user is not sign')
    }
    const user = ctx.service.auth.decode(token);
    if (!user) {
      return ctx.throw(401, 'token has expired')
    }
    ctx.user = user;
    await next()
  }
}