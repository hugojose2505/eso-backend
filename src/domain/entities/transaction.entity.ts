import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Cosmetic } from './cosmetic.entity';


@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Cosmetic, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cosmeticId' })
  cosmetic?: Cosmetic;

  @Column({ type: 'varchar' })
  type: 'PURCHASE' | 'REFUND';

  @Column({ type: 'varchar' })
  itemType: 'COSMETIC' | 'BUNDLE';

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'int' })
  balanceBefore: number;

  @Column({ type: 'int' })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}
