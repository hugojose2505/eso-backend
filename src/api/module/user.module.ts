import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/domain/entities/transaction.entity';
import { UserCosmetic } from 'src/domain/entities/user-cosmetic.entity';
import { User } from 'src/domain/entities/user.entity';
import { UsersController } from '../controller/user.controller';
import { UsersService } from '../service/user.service';


@Module({
  imports: [TypeOrmModule.forFeature([User, UserCosmetic, Transaction])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
