import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Cosmetic } from './cosmetic.entity';

@Entity('user_cosmetics')
@Unique(['user', 'cosmetic'])
export class UserCosmetic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.cosmetics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Cosmetic, (c) => c.userCosmetics, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cosmeticId' })
  cosmetic: Cosmetic;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  acquiredAt: Date;

  @Column({ type: 'varchar', default: 'SINGLE' })
  source: 'SINGLE' | 'BUNDLE';
}
