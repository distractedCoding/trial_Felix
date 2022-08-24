import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginController } from './login/login.controller';
import { RotateController } from './rotate/rotate.controller';
import { ValidateController } from './validate/validate.controller';
import { RotateService } from './rotate/rotate.service';
import { RotateModule } from './rotate/rotate.module';
import { LoginModule } from './login/login.module';
import { LoginService } from './login/login.service';
import { JwkController } from './jwk/jwk.controller';
import { JwkModule } from './jwk/jwk.module';
import { ValidateService } from './validate/validate.service';
import { ValidateModule } from './validate/validate.module';
import { JwkService } from './jwk/jwk.service';

@Module({
  imports: [RotateModule, LoginModule, JwkModule, ValidateModule],
  controllers: [
    AppController,
    LoginController,
    RotateController,
    ValidateController,
    JwkController,
  ],
  providers: [
    AppService,
    RotateService,
    LoginService,
    ValidateService,
    JwkService,
  ],
})
export class AppModule {}
