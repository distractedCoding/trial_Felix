import { generateKeyPair } from 'crypto';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Key } from 'readline';
import { keyPair } from './keyPair.model';

export type jwkState = {
  currentKey: keyPair | undefined;
  nextKey: keyPair | undefined;
};

@Injectable()
export class RotateService {
  private _state: jwkState = { currentKey: undefined, nextKey: undefined };

  async rotate(): Promise<jwkState> {
    return new Promise<jwkState>((resolve, reject) => {
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
              'snapaddy' /* some global config, provided/handled by yourself */,
          },
        },
        async (err, publicKey, privateKey) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          const keyId = uuidv4();

          if (this._state.currentKey) {
            console.log('CurrentKey is set');
            this._state.nextKey = this._state.currentKey;
            this._state.currentKey = { publicKey, privateKey, keyId };

            resolve({
              currentKey: this._state.currentKey,
              nextKey: this._state.nextKey,
            });
          } else {
            console.log('CurrentKey is not set');

            this._state.currentKey = { publicKey, privateKey, keyId };
            resolve(this.rotate());
          }
        },
      );
    });
  }

  public async getJwkState(): Promise<jwkState> {
    if (!this._state.currentKey) await this.rotate();
    return this._state;
  }
}
