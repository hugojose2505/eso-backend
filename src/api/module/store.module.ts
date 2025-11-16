import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';
import { Transaction } from 'src/domain/entities/transaction.entity';
import { UserCosmetic } from 'src/domain/entities/user-cosmetic.entity';
import { User } from 'src/domain/entities/user.entity';
import { StoreService } from '../service/store.service';
import { StoreController } from '../controller/store.controller';
import { AuthModule } from './auth.module';
import { Bundle } from 'src/domain/entities/bundle.entity';


@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User, Cosmetic, UserCosmetic, Transaction, Bundle]),
  ],
  providers: [StoreService],
  controllers: [StoreController],
})
export class StoreModule {}
