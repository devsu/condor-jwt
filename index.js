const JWT = require('./lib/jwt');

exports = module.exports = (options) => {
  return new JWT(options).getMiddleware();
};

exports.JWT = JWT;
