import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/domain/entities/transaction.entity';
import { UserCosmetic } from 'src/domain/entities/user-cosmetic.entity';
import { User } from 'src/domain/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(UserCosmetic)
    private readonly userCosmeticsRepo: Repository<UserCosmetic>,

    @InjectRepository(Transaction)
    private readonly transactionsRepo: Repository<Transaction>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      vbucksBalance: user.vbucksBalance,
      createdAt: user.createdAt,
    };
  }

  async getInventory(userId: string) {
    const items = await this.userCosmeticsRepo.find({
      where: { user: { id: userId } },
      relations: ['cosmetic'],
      order: { acquiredAt: 'DESC' },
    });

    return items.map((uc) => ({
      id: uc.id,
      acquiredAt: uc.acquiredAt,
      source: uc.source,
      cosmetic: {
        id: uc.cosmetic.id,
        name: uc.cosmetic.name,
        type: uc.cosmetic.type,
        rarity: uc.cosmetic.rarity,
        imageUrl: uc.cosmetic.imageUrl,
        price: uc.cosmetic.price,
      },
    }));
  }

  async getTransactions(userId: string) {
    const txs = await this.transactionsRepo.find({
      where: { user: { id: userId } },
      relations: ['cosmetic'],
      order: { createdAt: 'DESC' },
    });

    return txs.map((t) => ({
      id: t.id,
      type: t.type,
      itemType: t.itemType,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      createdAt: t.createdAt,
      cosmetic: t.cosmetic
        ? {
            id: t.cosmetic.id,
            name: t.cosmetic.name,
            price: t.cosmetic.price,
          }
        : null,
    }));
  }
}
