import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [],
  controllers: [FileController],
  providers: [FileService, ConfigService],
})
export class FileModule {}
