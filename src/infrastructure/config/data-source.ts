import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { Cosmetic } from '../../domain/entities/cosmetic.entity';
import { UserCosmetic } from '../../domain/entities/user-cosmetic.entity';
import { Transaction } from '../../domain/entities/transaction.entity';
import {  CreateBaseTables1710197923456 } from '../../database/migration/0001-create-initial-schema';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  entities: [User, Cosmetic, UserCosmetic, Transaction],
  migrations: [CreateBaseTables1710197923456],

  synchronize: false,
  logging: false,
});

export default dataSource;
