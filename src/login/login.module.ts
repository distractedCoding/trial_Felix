import { Module } from '@nestjs/common';
import { RotateModule } from '../rotate/rotate.module';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';

@Module({
  controllers: [LoginController],
  providers: [LoginService],
  imports: [RotateModule],
  exports: [LoginService],
})
export class LoginModule {}
