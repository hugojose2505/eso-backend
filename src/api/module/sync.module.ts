import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';
import { SyncService } from '../service/sync.service';
import { SyncController } from '../controller/sync.controller';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://fortnite-api.com/v2',
      timeout: 10000,
    }),
    TypeOrmModule.forFeature([Cosmetic]),
  ],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
