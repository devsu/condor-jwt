# condor-jwt

This module lets you authenticate GRPC calls using JSON Web Tokens (**JWTs**) in your [Condor](https://github.com/devsu/condor-framework) GRPC services.

[![Build Status](https://travis-ci.org/devsu/condor-jwt.svg?branch=master)](https://travis-ci.org/devsu/condor-jwt)
[![Coverage Status](https://coveralls.io/repos/github/devsu/condor-jwt/badge.svg?branch=master)](https://coveralls.io/github/devsu/condor-jwt?branch=master)

**Condor** is a [GRPC Framework for node](https://github.com/devsu/condor-framework).

## Installation

```bash
npm i --save condor-framework condor-jwt
```

## How to use

The JWT middleware decodes and verifies a JsonWebToken passed in the `authorization` header. If the token is valid, `context.token` (by default) will be set with the JSON object decoded to be used by later middleware for authorization and access control.

```js
const Condor = require('condor-framework');
const jwt = require('condor-jwt');
const Greeter = require('./greeter');

const app = new Condor()
  .addService('./protos/greeter.proto', 'myapp.Greeter', new Greeter())
  .use(jwt({'secretOrPublicKey': 'shhhhh'}))
  // middleware below this line is only reached if JWT token is valid
  .use((context, next) => {
    console.log('valid token found: ', context.token);
    next();
  })
  .start();
```

## Custom Methods

By default, the token will be retrieved from the `authorization` metadata. Also, you can provide your own method to retrieve the token. The method can be sync or async (return a promise). It must return the token object if found and valid, or null otherwise. The method will be called with the context and middleware options.

```js
options = {
  'getToken': (context, options) => {
    // do your magic here
    return token;
  },
};
```

In the same manner, you can provide your `isRevoked` method to determine if a token is revoked. The method can be sync or async (return a promise). If the token is not revoked, the method must return false or resolve with false.

```js
options = {
  'isRevoked': (context, token) => {
    // do your magic here
    return false;
  },
};
```

## Options

| Option            | Description                                                                                                             |
|-------------------|-------------------------------------------------------------------------------------------------------------------------|
| getToken          | Custom method to get the token                                                                                          |
| isRevoked         | Custom method to verify if a token is revoked                                                                           |
| propertyName      | Where to store the token in the context. Default is `token`                                                             |
| passthrough       | Continue to next, even if no valid authorization token was found. Default is `false`                                    |
| secretOrPublicKey | a string or buffer containing either the secret for HMAC algorithms, or the PEM encoded public key for RSA and ECDSA    |

Additionaly, you can send any option of the [verify](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) method of the [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) module:

- algorithms
- audience
- issuer
- ignoreExpiration
- subject
- clockTolerance
- maxAge
- clockTimestamp

Such options will be used to verify the token.

## License and Credits

MIT License. Copyright 2017 

Built by the [GRPC experts](https://devsu.com) at Devsu.
