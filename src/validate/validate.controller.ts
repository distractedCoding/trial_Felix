import { Controller, Get, Headers } from '@nestjs/common';
import { ValidateService } from './validate.service';

@Controller('validate')
export class ValidateController {
  constructor(private validateService: ValidateService) {}

  @Get()
  async validate(@Headers('Authorization') authHeader: string) {
    return this.validateService.validate(authHeader);
  }
}
