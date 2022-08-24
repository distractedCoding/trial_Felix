import { Module } from '@nestjs/common';
import { RotateModule } from '../rotate/rotate.module';
import { JwkController } from './jwk.controller';
import { JwkService } from './jwk.service';

@Module({
  controllers: [JwkController],

  imports: [RotateModule],

  providers: [JwkService],
})
export class JwkModule {}
