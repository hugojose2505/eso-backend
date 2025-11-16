import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { Cosmetic } from '../../domain/entities/cosmetic.entity';
import { UserCosmetic } from '../../domain/entities/user-cosmetic.entity';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Bundle } from '../../domain/entities/bundle.entity';

import {  CreateBaseTables1710197923456 } from '../../database/migration/0001-create-initial-schema';
import {  CreateBundles1731440000000 } from '../../database/migration/0002-create-bundle-schema';


const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,

  entities: [User, Cosmetic, UserCosmetic, Transaction, Bundle],
  migrations: [CreateBaseTables1710197923456, CreateBundles1731440000000],

  synchronize: false,
  logging: false,
});

export default dataSource;
