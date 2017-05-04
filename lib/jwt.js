const Token = require('simple-bearer-token');

const errors = {
  'INVALID_TOKEN': 'Invalid Token',
  'UNAUTHENTICATED': 'Unauthenticated',
};

module.exports = class {
  constructor(customOptions) {
    const defaultOptions = {
      'propertyName': 'token',
      'passthrough': false,
      'getToken': this.getToken,
      'isRevoked': this.isRevoked,
    };
    this.customOptions = customOptions;
    this.options = Object.assign({}, defaultOptions, customOptions);
  }

  getMiddleware() {
    return (context, next) => {
      let token;
      return Promise.resolve().then(() => {
        return this.options.getToken(context, this.customOptions);
      }).then((tokenFound) => {
        token = tokenFound;
        return this.options.isRevoked(context, token);
      }).then((isRevoked) => {
        if ((!token || isRevoked) && !this.options.passthrough) {
          throw {'code': 16, 'details': errors.UNAUTHENTICATED};
        }
        context[this.options.propertyName] = token;
        next();
      });
    };
  }

  getToken(context, options) {
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

  isRevoked() {
    return false;
  }
};
