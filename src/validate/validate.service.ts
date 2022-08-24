import { Injectable } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { rejects } from 'assert';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { LoginService } from '../login/login.service';

@Injectable()
export class ValidateService {
  constructor(private loginService: LoginService) {}

  async validate(token: string) {
    // Setup your client by parsing your own public key information:
    const jwksClient = new JwksClient({
      // Don't cache, as we wanna use the same public keys as the server endpoint provides "right now"
      cache: false,
      // Address of the JWKS endpoint to retrieve the public keys from:
      jwksUri: 'http://localhost:3000/.well-known/jwks.json',
    });

    // Validate a token signature and return it's payload
    // Extract the involved keyId from the JWT:
    const contents = jwt.decode(token, { complete: true });
    const keyId = contents?.header.kid;

    if (!keyId) {
      throw Error(' invalid JWT with no keyId-information');
    }

    // Get public signing key used via JWKS client:
    const signignKey = await jwksClient.getSigningKey(keyId);

    try {
      // ..and try to verify + return the decoded JWT payload:
      return jwt.verify(token, signignKey.getPublicKey());
    } catch (err) {
      // TODO: handle invalid signature
      return err;
    }
  }
}
