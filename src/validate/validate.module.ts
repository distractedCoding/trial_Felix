import { Module } from '@nestjs/common';
import { ValidateService } from './validate.service';
import { ValidateController } from './validate.controller';
import { LoginModule } from '../login/login.module';

@Module({
  providers: [ValidateService],
  controllers: [ValidateController],
  imports: [LoginModule],
})
export class ValidateModule {}
