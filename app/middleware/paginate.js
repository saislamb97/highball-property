
module.exports = (options, app) => {
  return async (ctx, next) => {
    if (+ctx.request.query.page && +ctx.request.query.pageSize) {
      ctx.request.query.paginate = ctx.helper.paginate(ctx.request.query)
      delete ctx.request.query.page
      delete ctx.request.query.pageSize
    }
    if (+ctx.request.body.page && +ctx.request.body.pageSize) {
      ctx.request.body.paginate = ctx.helper.paginate(ctx.request.body)
      delete ctx.request.body.page
      delete ctx.request.body.pageSize
    }
    await next()
  }
}