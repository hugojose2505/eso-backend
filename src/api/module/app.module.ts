import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/api/module/auth.module';
import { UsersModule } from 'src/api/module/user.module';
import { CosmeticsModule } from 'src/api/module/cosmetic.module';
import { StoreModule } from 'src/api/module/store.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncModule } from './sync.module';
import { PublicUsersModule } from './users-list.module';
import { BundleModule } from './bundle.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    ScheduleModule.forRoot(),
    SyncModule,
    AuthModule,
    BundleModule,
    UsersModule,
    CosmeticsModule,
    PublicUsersModule,
    StoreModule,
  ],
})
export class AppModule {}
