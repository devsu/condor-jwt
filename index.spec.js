const index = require('./index');
const jwt = require('./lib/jwt');

describe('module', () => {
  it('should expose jwt() method', () => {
    expect(index).toEqual(jwt);
  });
});
