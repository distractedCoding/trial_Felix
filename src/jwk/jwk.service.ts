import { Injectable } from '@nestjs/common';
import { jwkState, RotateService } from '../rotate/rotate.service';
import { exportJWK, importSPKI } from 'jose';

@Injectable()
export class JwkService {
  constructor(private rotateService: RotateService) {}

  async getJwk() {
    const jwkState: jwkState = await this.rotateService.getJwkState();

    if (jwkState.currentKey && jwkState.nextKey) {
      const jwkCurrentPub = jwkState.currentKey?.publicKey;
      const jwkNextPub = jwkState.nextKey?.publicKey;

      const jwkCurrent = await exportJWK(
        await importSPKI(jwkCurrentPub, 'RSA256'),
      );
      const jwkNext = await exportJWK(await importSPKI(jwkNextPub, 'RSA256'));

      jwkCurrent.kid = jwkState.currentKey?.keyId;
      jwkNext.kid = jwkState.nextKey?.keyId;
      const jwksResponse = {
        keys: [jwkCurrent, jwkNext],
      };
      return jwksResponse;
    }
  }
}
