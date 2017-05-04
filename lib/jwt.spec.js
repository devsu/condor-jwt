const Spy = require('jasmine-spy');
const grpc = require('grpc');
const JWT = require('./jwt');
const errors = require('./errors.json');
const ContextHelper = require('../spec/contextHelper');
const TokenHelper = require('../spec/tokenHelper');

describe('JWT', () => {
  let contextHelper, tokenHelper, originalConsoleError, next, options,
    getToken, isRevoked, jwt, middleware;

  beforeAll(() => {
    originalConsoleError = console.error;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    console.error = Spy.create();
    contextHelper = new ContextHelper();
    tokenHelper = new TokenHelper();
    next = Spy.resolve();
  });

  it('should return the class', () => {
    jwt = new JWT();
    expect(jwt instanceof JWT);
  });

  describe('getMiddleware()', () => {
    describe('without authorization metadata', () => {
      beforeEach(() => {
        jwt = new JWT();
        middleware = jwt.getMiddleware();
        contextHelper.setupEmptyContext();
      });

      it('should NOT attach any token to the context', (done) => {
        middleware(contextHelper.context, next).catch(() => {
          expect(contextHelper.context.token).toBeUndefined();
          done();
        });
      });

      it('should reject with UNAUTHENTICATED error', (done) => {
        middleware(contextHelper.context, next).catch((error) => {
          expect(error.code).toEqual(grpc.status.UNAUTHENTICATED);
          expect(error.details).toEqual(errors.UNAUTHENTICATED);
          done();
        });
      });
    });

    describe('with invalid authorization metadata', () => {
      beforeEach(() => {
        jwt = new JWT();
        middleware = jwt.getMiddleware();
        contextHelper.setupValidContext('invalid token');
      });

      it('should NOT attach any token to the context', (done) => {
        middleware(contextHelper.context, next).catch(() => {
          expect(contextHelper.context.token).toBeUndefined();
          done();
        });
      });

      it('should reject with UNAUTHENTICATED error', (done) => {
        middleware(contextHelper.context, next).catch((error) => {
          expect(error.code).toEqual(grpc.status.UNAUTHENTICATED);
          expect(error.details).toEqual(errors.UNAUTHENTICATED);
          done();
        });
      });

      it('should log the error', (done) => {
        middleware(contextHelper.context, next).catch(() => {
          expect(console.error).toHaveBeenCalledTimes(1);
          expect(console.error).toHaveBeenCalledWith(errors.INVALID_TOKEN,
            contextHelper.context.properties, jasmine.any(Error));
          done();
        });
      });
    });

    describe('with valid authorization metadata', () => {
      beforeEach(() => {
        tokenHelper.setupValidToken();
        options = {'secretOrPublicKey': tokenHelper.keys.public};
        jwt = new JWT(options);
        middleware = jwt.getMiddleware();
      });

      describe('with Bearer prefix', () => {
        beforeEach(() => {
          contextHelper.setupValidContext(tokenHelper.bearerTokenString);
        });

        it('should attach the token to the context', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(contextHelper.context.token).toBeDefined();
            tokenHelper.verifyToken(contextHelper.context.token);
            done();
          });
        });

        it('should call next', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(next).toHaveBeenCalledTimes(1);
            done();
          });
        });
      });

      describe('without Bearer prefix', () => {
        beforeEach(() => {
          contextHelper.setupValidContext(tokenHelper.tokenString);
        });

        it('should attach the token to the context', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(contextHelper.context.token).not.toBeUndefined();
            tokenHelper.verifyToken(contextHelper.context.token);
            done();
          });
        });

        it('should call next', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(next).toHaveBeenCalledTimes(1);
            done();
          });
        });
      });
    });

    describe('with getToken option', () => {
      beforeEach(() => {
        getToken = Spy.returnValue('whatever');
        options = {getToken};
        jwt = new JWT(options);
        middleware = jwt.getMiddleware();
      });

      it('should call getToken with the right arguments', (done) => {
        contextHelper.setupEmptyContext();
        middleware(contextHelper.context, next).then(() => {
          expect(getToken).toHaveBeenCalledTimes(1);
          expect(getToken).toHaveBeenCalledWith(contextHelper.context, options);
          done();
        });
      });

      describe('with authorization metadata', () => {
        beforeEach(() => {
          contextHelper.setupValidContext('aaaa');
        });
        it('should use method passed to get the token', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(getToken).toHaveBeenCalledTimes(1);
            expect(contextHelper.context.token).toEqual('whatever');
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });
      });

      describe('without authorization metadata', () => {
        beforeEach(() => {
          contextHelper.setupEmptyContext();
        });
        it('should use method passed to get the token', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(getToken).toHaveBeenCalledTimes(1);
            expect(contextHelper.context.token).toEqual('whatever');
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });
      });

      describe('when returns a promise', () => {
        beforeEach(() => {
          getToken = Spy.resolve('whatever');
          options = {getToken};
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
          contextHelper.setupEmptyContext();
        });
        it('should resolve the promise and set the token', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(getToken).toHaveBeenCalledTimes(1);
            expect(contextHelper.context.token).toEqual('whatever');
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });
      });

      describe('when isRevoked is passed', () => {
        beforeEach(() => {
          getToken = Spy.resolve('whatever');
          isRevoked = Spy.resolve(true);
          options = {getToken, isRevoked};
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
          contextHelper.setupEmptyContext();
        });
        it('should call isRevoked', (done) => {
          middleware(contextHelper.context, next).catch(() => {
            expect(isRevoked).toHaveBeenCalledTimes(1);
            expect(contextHelper.context.token).toBeUndefined();
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });
      });
    });

    describe('with isRevoked option', () => {
      beforeEach(() => {
        tokenHelper.setupValidToken();
        options = {'secretOrPublicKey': tokenHelper.keys.public};
        contextHelper.setupValidContext(tokenHelper.tokenString);
        isRevoked = Spy.create();
        options.isRevoked = isRevoked;
        jwt = new JWT(options);
        middleware = jwt.getMiddleware();
      });

      it('should call isRevoked with the right arguments', (done) => {
        middleware(contextHelper.context, next).then(() => {
          expect(isRevoked).toHaveBeenCalledTimes(1);
          expect(isRevoked).toHaveBeenCalledWith(contextHelper.context,
            contextHelper.context.token);
          done();
        });
      });

      describe('returns true', () => {
        beforeEach(() => {
          isRevoked = Spy.returnValue(true);
          options.isRevoked = isRevoked;
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
        });

        it('should not set the access token', (done) => {
          middleware(contextHelper.context, next).catch(() => {
            expect(contextHelper.context.token).toBeUndefined();
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });

        it('should reject with UNAUTHENTICATED error', (done) => {
          middleware(contextHelper.context, next).catch((error) => {
            expect(error.code).toEqual(grpc.status.UNAUTHENTICATED);
            expect(error.details).toEqual(errors.UNAUTHENTICATED);
            done();
          });
        });
      });

      describe('resolves true', () => {
        beforeEach(() => {
          isRevoked = Spy.resolve(true);
          options.isRevoked = isRevoked;
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
        });

        it('should not set the access token', (done) => {
          middleware(contextHelper.context, next).catch(() => {
            expect(contextHelper.context.token).toBeUndefined();
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });

        it('should reject with UNAUTHENTICATED error', (done) => {
          middleware(contextHelper.context, next).catch((error) => {
            expect(error.code).toEqual(grpc.status.UNAUTHENTICATED);
            expect(error.details).toEqual(errors.UNAUTHENTICATED);
            done();
          });
        });
      });

      describe('returns false', () => {
        beforeEach(() => {
          isRevoked = Spy.returnValue(false);
          options.isRevoked = isRevoked;
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
        });

        it('should leave the access token', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(contextHelper.context.token).toBeDefined();
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });
      });

      describe('resolves false', () => {
        beforeEach(() => {
          isRevoked = Spy.resolve(false);
          options.isRevoked = isRevoked;
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
        });

        it('should leave the access token', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(contextHelper.context.token).toBeDefined();
            expect(console.error).not.toHaveBeenCalled();
            done();
          });
        });
      });
    });

    describe('with propertyName option', () => {
      beforeEach(() => {
        tokenHelper.setupValidToken();
        contextHelper.setupValidContext(tokenHelper.bearerTokenString);
        options = {'secretOrPublicKey': tokenHelper.keys.public, 'propertyName': 'myjwt'};
        jwt = new JWT(options);
        middleware = jwt.getMiddleware();
      });

      it('should use the propertyName instead of "token"', (done) => {
        middleware(contextHelper.context, next).then(() => {
          expect(contextHelper.context.token).toBeUndefined();
          tokenHelper.verifyToken(contextHelper.context.myjwt);
          done();
        });
      });
    });

    describe('with passthrough option', () => {
      beforeEach(() => {
        contextHelper.setupValidContext('invalid token');
      });
      describe('true', () => {
        beforeEach(() => {
          options = {'passthrough': true};
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
        });
        it('should call next', (done) => {
          middleware(contextHelper.context, next).then(() => {
            expect(next).toHaveBeenCalledTimes(1);
            done();
          });
        });
      });
      describe('false', () => {
        beforeEach(() => {
          options = {'passthrough': false};
          jwt = new JWT(options);
          middleware = jwt.getMiddleware();
        });
        it('should reject with UNAUTHENTICATED error', (done) => {
          middleware(contextHelper.context, next).catch((error) => {
            expect(error.code).toEqual(grpc.status.UNAUTHENTICATED);
            expect(error.details).toEqual(errors.UNAUTHENTICATED);
            done();
          });
        });
      });
    });
  });
});
