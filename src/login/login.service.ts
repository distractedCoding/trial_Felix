import { Injectable } from '@nestjs/common';
import { authUserDto } from './dto/authUserDto.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { jwkState, RotateService } from '../rotate/rotate.service';
import { keyPair } from '../rotate/keyPair.model';
@Injectable()
export class LoginService {
  constructor(private rotateService: RotateService) {}

  private getPasswordHashFromDb(username: string) {
    // Calculating a salted password hash
    const saltedHash = bcrypt.hashSync('123', 10);

    return saltedHash;
  }

  private async generateJWT(username: string) {
    const jwkState: jwkState = await this.rotateService.getJwkState();

    const payload = { name: username };

    if (jwkState.nextKey) {
      const involvedKey: keyPair = jwkState.nextKey;

      const token = jwt.sign(payload, involvedKey.privateKey, {
        expiresIn: '60m',
        keyid: involvedKey.keyId,
      });

      return token;
    } else {
      throw Error('Current key is undefine ');
    }
  }

  auth(authUser: authUserDto) {
    const username = authUser.name;
    const password = authUser.password;
    console.log(authUser);
    const passwordHash = this.getPasswordHashFromDb(username);

    // Verifying a provided clear text password against a stored hash
    const isAuthenticated = bcrypt.compareSync(password, passwordHash);
    if (isAuthenticated) {
      //TODO: JWT Return
      return this.generateJWT(username);
    }
    return 'Wrong Username or Password';
  }
}
