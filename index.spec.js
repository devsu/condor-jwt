const proxyquire = require('proxyquire');
const Spy = require('jasmine-spy');
const index = require('./index');
const JWT = require('./lib/jwt');

describe('module', () => {
  it('should expose jwt() method', () => {
    expect(index).toEqual(jasmine.any(Function));
  });

  it('should expose the JWT class', () => {
    expect(index.JWT).toEqual(JWT);
  });

  describe('jwt()', () => {
    let fakeIndex, JWTStub, options, middleware, constructorCount;
    beforeEach(() => {
      constructorCount = 0;
      options = {'foo': 'bar'};
      JWTStub = class {
        constructor(opt) {
          expect(opt).toEqual(options);
          constructorCount++;
        }
      };
      middleware = Spy.resolve();
      JWTStub.prototype.getMiddleware = Spy.returnValue(middleware);
      fakeIndex = proxyquire('./index', {'./lib/jwt': JWTStub});
    });

    it('should create JWT instance with the options and return its middleware', () => {
      const actualMiddleware = fakeIndex(options);
      expect(constructorCount).toEqual(1);
      expect(actualMiddleware).toEqual(middleware);
    });
  });
});
