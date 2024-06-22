'use strict';
const moment = require('moment');
exports.relativeTime = time => moment(new Date(time * 1000)).fromNow();

exports.paginate = ({page, pageSize}) => {
  const paginate = +page && +pageSize
    ? { offset: (+page - 1) * +pageSize,
        limit: +pageSize,
      }
    : {};
  return paginate;
}