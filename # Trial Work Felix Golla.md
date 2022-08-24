# Trial Work Felix Golla

## Desired Tech Stack

Just forehand, installation hints follow, but in general we wanna use:

- [NodeJS 18](https://nodejs.org)
- [NestJS 9](https://docs.nestjs.com/#installation)
  - _with enabled_ `strict` mode (use `--strict`-flag when invoking `nest-cli`)
  - using `pnpm` as package manager (asked during execution of `nest-cli`)
- [TypeScript 4.7+](https://www.npmjs.com/package/typescript) (will be used automatically when using `nest-cli`)
- [PostgreSQL 14](https://www.postgresql.org/)

## Challenge

Write a simple NestJS-backend which supports [a rotating JSON Web Key Set](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-key-sets)
for authentication/authorization purposes. "Rotation in the JWKS" means, that the _server_ creates [JSON Web Tokens](https://jwt.io/introduction) using private keys that can be exchanged on-the-fly, while _clients_ can verify that a given JWT was signed by your server. The server therefore offers a public endpoint, which provides a collection of all valid public keys associated with their respective key-ID. So, clients can retrieve the list of public keys and their IDs, and then, when being presented a JWT, can verify the token's signature by picking the right public key via key-ID (`kid` property) given in the JWT's header field. "On the fly" means, that we want to be manually be able to trigger an explicit "drop that oldest key-pair and generate a new one". In our challenge, we want the server to always use _two_ key-pairs, a `current` one and a `next` one.

Short description of the requirements:

1. there's an endpoint a user can `POST` some JSON-payload to, holding a `name`/`password`-combination (`[1]`: `auth`-endpoint)
2. the `auth`-endpoint will check if the provided credentials match a known "username/salted password hash"-combination (`[2]`: `bcryptjs`-hashing)
3. if the credentials are valid, the `auth`-endpoint provides JSON Web Token in the response (`[3]`: JWT)
4. the server can two involve _different_ "public key/private key"-pairs for signing that JWT, a `current`-key pair and a `next`-key pair (`[4]`: two JWK at a time)
5. the server has a `GET`-endpoint for dropping the `current`-key pair, making the `next`-key pair the new `current`-key pair, and,
   on-the-fly-generating another `next`-key pair (`[5]`: `rotate`-endpoint)
6. the `auth`-endpoint always signs a returned JWT with the `next`-key pair (`[6]`: `next`-signatures)
7. consider "external systems" to also be able to verify whether or not a JWT is "still valid" and "really signed by your server"
8. that's why your server has a dedicated JWKS-endpoint, which provides, in JSON-shape, an array of all known valid keys "right now" (`[8]`: `JWKS`-endpoint)
9. for checking purposes, your server provides a validation endpoint, which involves a JWKS-client for retrieving the "current" keys
   from your own `JWKS`-endpoint, and uses those for verifying a provided JWT's token (`9`: `validate`-endpoint)
10. create a reusable authorization mechanism using a NestJS guard called `@ValidJwt`-pattern (`10`: `guard`-mechanism)
11. retrieve the "username/salted password hash"-combinations from a PostgreSQL-instance (`11`: `SQL`-data source), either by just using the `pg`-driver package, or via `@nestjs/typeorm`

What we expect to do:

- get a signed JWT when providing a valid user/password-combination (`[1]`)
- the signed JWT can be verified using your provided endpoint (`[9]`)
- we can rotate the JWK using your provided endpoint (`[5]`)
- after several rotations, the validation endpoint will deny a JWT to be valid, when the corresponding public key is no longer being available (`[9]`, `[5]`)

## Project Preparations

For having the required external tools/libraries available, add the following runtime dependencies to your project, using:

    pnpm add bcryptjs jsonwebtoken jose jwks-rsa pg

Add the following development type information to your project: (depending on involved OS, '@'-characters probably need to be escaped in command line)

    pnpm add -D @types/pg @types/bcryptjs @types/jsonwebtoken

## Your Priorities over time

1. _first_, get your server's endpoints for JWKS-, JWT-retrieval- & -validation, as well as JWK rotate-endpoint done (`[1]`, `[5]`, `[8]`, `[9]`)
2. _then_, create the `@ValidJwt()` decorator/guard for protecting your `validate`-controller function from being invoked without valid JWT (`[10]`)
3. _finally_, integrate the PostgreSQL for obtaining username/salted password hash information, either using `pg` directly, or integrating `@nestjs/typeorm`

## Accompanying Explanations

### Endpoints

The following four endpoints are suggested to be implemented by your server:

- `POST /login` for the `auth`-endpoint providing the JWTs (`[1]`)
- `GET /rotate` for the `rotate`-endpoint what disposes the `current`-key pair, making `next` the new `current` and generating a new `next`-keypair
- `GET /.well-known/jwks.json` for the `JWKS`-endpoint providing all currently involved public keys (`[6]`)
- `GET /validate` accepting a `Authorization: Bearer (JWT)`-header for checking whether or not a JWT is valid

### Signature Keys

For making your server providing signed JWT (JSON Web Tokens), your server needs to always generate the a key-pair being:

- a _private_ key for _signing_ a JWT
- a _public_ key in order to allow others to _verify_ the signature of a JWT actually being created with the corresponding private key

For on-the-fly-generating that private/public key pairs, you can use [NodeJS generateKeyPair()-function from the `crypto`-package]() like this:

```typescript
import { generateKeyPair } from 'crypto';

generateKeyPair(
  'rsa',
  {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase:
        someSecretPassphrase /* some global config, provided/handled by yourself */,
    },
  },
  (err, publicKey, privateKey) => {
    // Handle error or/and use generated publicKey/privateKey-pair,
    // complement some unique keyId, see in the hint below
  }
);
```

#### Hint: additional keyId required

Because your server and clients need to know _which_ "public/private-key pair" is relevant used for signing/verifying a JWT,
you need to add an unique identifier to each public/private-key pair. Thus, you should generate some kind
of unique `keyId`-string along with the `publicKey`/`privateKey`-pair, so you can later embed the `keyId`
in the JWT, allowing the verification process to pick the right public key during verification process.

The value given in `privateKey` can _then_ be used by you to _sign_ a JSON-payload in shape of a JWT like this:

```typescript
import * as jwt from 'jsonwebtoken';

// Assumes user authentication via password succeeded

// Payload of your JWT, is at least the user name of the authenticated user:
const payload = { name: username };

// Assuming your internal data model stored those values in something similar like this:
const involvedKey = { publicKey, privateKey, keyId };

// Create a signed JWT from that payload, using that key-pair, important to embed "keyid" in the options:
const token = jwt.sign(payload, involvedKey.privateKey, {
  expiresIn: '60m',
  keyid: involvedKey.keyId,
});

// Return the token-string to the requester
```

The value given in `publicKey` can _then_ be converted to a JWK (later and provided by your JWKS-endpoint) like this:

```typescript
import { exportJWK, importSPKI } from 'jose';

// Converts a single SPKI-public key into the JWK-format:
const jwk = await exportJWK(await importSPKI(publicKey, 'RSA256'));

// Don't forget to complement that keyId in some JWK-conform way:
jwk.kid = yourUniqueKeyId;

// Store that jwk-value somethere, so your JWKS endpoint can provide it as response of shape:

// JSON-response of your JWKS-endpoint would then simply look like this:
const jwksResponse = {
  keys: [jwk /* ...other JWK-keys currently being valid for signing*/],
};
```

### Verification via JWKS client

In order to verify a given token, involve a `JwksClient`, using your own JWKS-endpoint for configuration, like this:

```typescript
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';

// Setup your client by parsing your own public key information:
const jwksClient = new JwksClient({
  // Don't cache, as we wanna use the same public keys as the server endpoint provides "right now"
  cache: false,

  // Address of the JWKS endpoint to retrieve the public keys from:
  jwksUri: 'http://localhost:3000/.well-known/jwks.json',
});

// Validate a token signature and return it's payload:
public async getVerifiedPayload<P extends Record<string, unknown>>(
  token: string,
): Promise<P> {
  // Extract the involved keyId from the JWT:
  const contents = jwt.decode(token, { complete: true });
  const keyId = contents?.header.kid;

  if (!keyId) {
    // TODO: handle invalid JWT with no keyId-information
  }

  // Get public signing key used via JWKS client:
  const signignKey = await jwksClient.getSigningKey(keyId);

  try {
    // ..and try to verify + return the decoded JWT payload:
    return jwt.verify(token, signignKey.getPublicKey()) as P;
  } catch (err) {
    // TODO: handle invalid signature
  }
}
```

### Salted password hashes

```typescript
import * as bcrypt from 'bcryptjs';

// Calculating a salted password hash
const password = '123';
const saltedHash = bcrypt.hashSync(password, 10);

// Verifying a provided clear text password against a stored hash
const isAuthenticated = bcrypt.compareSync('123', passwordHash);
```

### Using a NestJS guard

- have a look at [NestJS CanActivate-interface](https://docs.nestjs.com/guards#authorization-guard) in order to get access to the native `request`-object
- use `request.headers['header-name']` in order to access some header value
- check for the authorization header's `Bearer`-token and that JWT's signature integrity
- use [a guard](https://docs.nestjs.com/guards#binding-guards) in order to create an access guard

https://docs.nestjs.com/#installation
