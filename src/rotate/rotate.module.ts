import { Module } from '@nestjs/common';
import { RotateController } from './rotate.controller';
import { RotateService } from './rotate.service';

@Module({
  controllers: [RotateController],
  providers: [RotateService],
  exports: [RotateService],
})
export class RotateModule {}
