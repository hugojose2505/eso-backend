import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cosmetic } from './cosmetic.entity';

@Entity('bundles')
export class Bundle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', default: 0 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isPromo: boolean;

  @ManyToMany(() => Cosmetic, (cosmetic) => cosmetic.bundles, {
    eager: true, 
  })
  @JoinTable({
    name: 'bundle_cosmetics',
    joinColumn: { name: 'bundle_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cosmetic_id', referencedColumnName: 'id' },
  })
  cosmetics: Cosmetic[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
