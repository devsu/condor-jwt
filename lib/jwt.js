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
    };
    this.options = Object.assign({}, defaultOptions, customOptions);
  }

  getMiddleware() {
    return (context, next) => {
      let token;
      return Promise.resolve().then(() => {
        if (this.options.getToken) {
          return this.options.getToken(context);
        }
        return this.getToken(context);
      }).then((tokenFound) => {
        token = tokenFound;
        if (this.options.isRevoked) {
          return this.options.isRevoked(context, token);
        }
        return this.isRevoked(context, token);
      }).then((isRevoked) => {
        if ((!token || isRevoked) && !this.options.passthrough) {
          throw {'code': 16, 'details': errors.UNAUTHENTICATED};
        }
        context[this.options.propertyName] = token;
        next();
      });
    };
  }

  getToken(context) {
    const bearer = context.metadata.get('authorization')[0];
    if (!bearer) {
      return;
    }
    try {
      return new Token(bearer, this.options);
    } catch (error) {
      console.error(errors.INVALID_TOKEN, context.properties, error);
    }
  }

  isRevoked() {
    return false;
  }
};
