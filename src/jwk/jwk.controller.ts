import { Controller, Get } from '@nestjs/common';
import { JWK } from 'jose';
import { JwkService } from './jwk.service';

@Controller()
export class JwkController {
  constructor(private jwkService: JwkService) {}

  @Get('.well-known/jwks.json')
  async getJwk(): Promise<{ keys: JWK[] } | undefined> {
    return await this.jwkService.getJwk();
  }
}
