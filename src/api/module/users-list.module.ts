import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/domain/entities/user.entity';
import { PublicUsersController } from '../controller/users-list.controller';
import { PublicUsersService } from '../service/users-list.service';


@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [PublicUsersController],
  providers: [PublicUsersService],
})
export class PublicUsersModule {}
