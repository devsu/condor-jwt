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

The JWT authentication middleware authenticates callers using a JWT token. If the token is valid, `context.token` (by default) will be set with the JSON object decoded to be used by later middleware for authorization and access control.

```js
const Condor = require('condor-framework');
const jwt = require('condor-jwt');
const Greeter = require('./greeter');

const app = new Condor()
  .addService('./protos/greeter.proto', 'myapp.Greeter', new Greeter())
  .use(jwt({'secretOrPublicKey': 'shhhhh'}))
  // middleware below this line (and the actual service implementation) 
  // are reached only if JWT token is valid
  .use((context, next) => {
    console.log('valid token found: ', context.token);
    next();
  })
  .start();
```

## Custom Methods

The token will be retrieved from the `authorization` metadata. Anyways, you can provide your own method to retrieve the token passing the `getToken` option. It must return the token object if found and valid, or null otherwise. The method will be called with the context and middleware options.

```js
options = {
  'getToken': (context) => {
    // do your magic here
    return token;
  },
};
```

In the same manner, you can provide your `isRevoked` async method to determine if a token is revoked. If the token is not revoked, the promise must resolve with false, otherwise (the promise resolve with true or error) the token is revoked.

```js
options = {
  'isRevoked': (token, context) => {
    // do your magic here
    return false;
  },
};
```

## Options

| Option            | Description                                                                                                             |
|-------------------|-------------------------------------------------------------------------------------------------------------------------|
| getToken          | Custom method to get the token, with the signature getToken(options)                                                    |
| isRevoked         | Custom method to verify if a token is revoked                                                                           |
| secretOrPublicKey | a string or buffer containing either the secret for HMAC algorithms, or the PEM encoded public key for RSA and ECDSA    |
| algorithms        | List of strings with the names of the allowed algorithms. For instance, `["HS256", "HS384"]`                            |
| audience          | if you want to check audience (`aud`), provide a value here |
| issuer            | string or array of strings of valid values for the `iss` field. |
| ignoreExpiration  | if `true` do not validate the expiration of the token. |
| ignoreNotBefore   | |
| subject           | if you want to check subject (`sub`), provide a value here |
| clockTolerance    | number of seconds to tolerate when checking the `nbf` and `exp` claims, to deal with small clock differences among different servers |
| maxAge            | the maximum allowed age for tokens to still be valid. Currently it is expressed in milliseconds or a string describing a time span [zeit/ms](https://github.com/zeit/ms). Eg: `1000`, `"2 days"`, `"10h"`, `"7d"`. **We advise against using milliseconds precision, though, since JWTs can only contain seconds. The maximum precision might be reduced to seconds in the future.** |
| clockTimestamp    | the time in seconds that should be used as the current time for all necessary comparisons (also against `maxAge`, so our advise is to avoid using `clockTimestamp` and a `maxAge` in milliseconds together) |

As you can see, this module accepts all options of the [verify](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) method of the [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) module. Such options will be used to verify the token.

## License and Credits

MIT License. Copyright 2017 

Built by the [GRPC experts](https://devsu.com) at Devsu.
