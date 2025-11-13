import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';
import { Transaction } from 'src/domain/entities/transaction.entity';
import { UserCosmetic } from 'src/domain/entities/user-cosmetic.entity';
import { User } from 'src/domain/entities/user.entity';
import { StoreService } from '../service/store.service';
import { StoreController } from '../controller/store.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, Cosmetic, UserCosmetic, Transaction]),
  ],
  providers: [StoreService],
  controllers: [StoreController],
})
export class StoreModule {}
