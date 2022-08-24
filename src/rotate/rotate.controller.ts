import { Get } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { jwkState, RotateService } from './rotate.service';
import { keyPair } from './keyPair.model';

@Controller('rotate')
export class RotateController {
  constructor(private rotateService: RotateService) {}

  @Get()
  async rotate(): Promise<Required<jwkState>> {
    return await this.rotateService.rotate();
  }
}
