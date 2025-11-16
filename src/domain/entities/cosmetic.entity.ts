import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserCosmetic } from './user-cosmetic.entity';
import { Bundle } from './bundle.entity';

@Entity('cosmetics')
export class Cosmetic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  externalId: string;

  @Column()
  name: string;

  @Column()
  type: string; 

  @Column()
  rarity: string; 

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: false })
  isNew: boolean;

  @Column({ default: false })
  isOnSale: boolean;

  @Column({ default: false })
  isPromo: boolean;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'date', nullable: true })
  releaseDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt?: Date;

  @OneToMany(() => UserCosmetic, (uc) => uc.cosmetic)
  userCosmetics: UserCosmetic[];

  @ManyToMany(() => Bundle, (bundle) => bundle.cosmetics)
  bundles: Bundle[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
