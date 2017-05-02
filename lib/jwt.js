const Token = require('./token');
const errors = require('./errors.json');

module.exports = (customOptions) => {
  const defaultOptions = {'propertyName': 'token', 'passthrough': false, getToken, isRevoked};
  const options = Object.assign({}, defaultOptions, customOptions);
  return (context, next) => {
    let token;
    return Promise.resolve().then(() => {
      return options.getToken(context, customOptions);
    }).then((tokenFound) => {
      token = tokenFound;
      return options.isRevoked(context, token);
    }).then((isRevoked) => {
      if ((!token || isRevoked) && !options.passthrough) {
        throw {'code': 16, 'details': errors.UNAUTHENTICATED};
      }
      context[options.propertyName] = token;
      next();
    });
  };
};

function getToken(context, options) {
  const bearer = context.metadata.get('authorization')[0];
  if (!bearer) {
    return;
  }
  try {
    return new Token(bearer, options);
  } catch (error) {
    console.error(errors.INVALID_TOKEN, context.properties, error);
  }
}

function isRevoked() {
  return false;
}
