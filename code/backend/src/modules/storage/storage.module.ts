import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageConfig } from './storage.config';

@Module({
  providers: [StorageService, StorageConfig],
  exports: [StorageService],
})
export class StorageModule {}
