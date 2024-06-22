module.exports = () => {
  return async function validateRequestParams(ctx, next) {
    var error = false;
    const params = { ...ctx.request.query, ...ctx.request.body };
    const paramsKeys = Object.keys(params)

    if (ctx.params?.hasOwnProperty('id')) {
      if ([undefined, null, "undefined", "null"].includes(ctx.params.id)) {
        error = { 'params.id': ctx.params.id }
      }
    }

    const intKeys = [
      'page', 'pageSize'
    ]
    if (!error) {
      for (let k of intKeys) {
        if (paramsKeys.includes(k)) {
          if (params[k] !== "null" && params[k] != null && params[k] !== "undefined" && params[k] != undefined) {
            if (isNaN(+params[k]) || +params[k] < 0) {
              error = { [k]: params[k] }
              break;
            }
          }
        }
      }
    }

    if (error) {
      ctx.status = 422;
      ctx.body = { message: 'params validate failed', data: error }
    } else {
      await next()
    }
  }
}