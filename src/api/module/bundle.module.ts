import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bundle } from 'src/domain/entities/bundle.entity';
import { BundleService } from '../service/bundle.service';
import { BundleController } from '../controller/bundle.controller';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Bundle, Cosmetic])],
  providers: [BundleService],
  controllers: [BundleController],
  exports: [BundleService],
})
export class BundleModule {}
