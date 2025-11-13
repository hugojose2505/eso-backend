import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';
import { CosmeticsController } from '../controller/cosmetic.controller';
import { CosmeticsService } from '../service/cosmetic.service';


@Module({
  imports: [TypeOrmModule.forFeature([Cosmetic])],
  providers: [CosmeticsService],
  controllers: [CosmeticsController],
  exports: [CosmeticsService],
})
export class CosmeticsModule {}
