import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';
import { Transaction } from 'src/domain/entities/transaction.entity';
import { UserCosmetic } from 'src/domain/entities/user-cosmetic.entity';
import { User } from 'src/domain/entities/user.entity';
import { Bundle } from 'src/domain/entities/bundle.entity';
import { DataSource, Repository } from 'typeorm';
import { PurchaseDto } from '../dto/purchase/purchase.dto';
import { RefundDto } from '../dto/refound/refound.dto';

@Injectable()
export class StoreService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @InjectRepository(Cosmetic)
    private readonly cosmeticsRepo: Repository<Cosmetic>,

    @InjectRepository(UserCosmetic)
    private readonly userCosmeticsRepo: Repository<UserCosmetic>,

    @InjectRepository(Transaction)
    private readonly transactionsRepo: Repository<Transaction>,

    @InjectRepository(Bundle)
    private readonly bundlesRepo: Repository<Bundle>,
  ) {}

  async purchase(userId: string, dto: PurchaseDto) {
    const { cosmeticId, bundleId } = dto;

    if (cosmeticId && bundleId) {
      throw new BadRequestException(
        'Informe apenas cosmeticId OU bundleId, não os dois.',
      );
    }

    if (bundleId) {
      return this.purchaseBundle(userId, bundleId);
    }

    if (cosmeticId) {
      return this.purchaseCosmetic(userId, cosmeticId);
    }

    throw new BadRequestException('Informe cosmeticId ou bundleId.');
  }


  private async purchaseCosmetic(userId: string, cosmeticId: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const cosmetic = await manager.findOne(Cosmetic, {
        where: { id: cosmeticId },
      });
      if (!cosmetic) throw new NotFoundException('Cosmetic not found');

      const alreadyOwned = await manager.count(UserCosmetic, {
        where: {
          user: { id: user.id },
          cosmetic: { id: cosmetic.id },
        },
      });

      if (alreadyOwned > 0) {
        throw new BadRequestException('Cosmético já adquirido.');
      }

      if (user.vbucksBalance < cosmetic.price) {
        throw new BadRequestException('Saldo insuficiente de v-bucks.');
      }

      const balanceBefore = user.vbucksBalance;
      user.vbucksBalance -= cosmetic.price;

      await manager.save(user);

      const userCosmetic = manager.create(UserCosmetic, {
        user,
        cosmetic,
        source: 'SINGLE',
      });
      await manager.save(userCosmetic);

      const tx = manager.create(Transaction, {
        user,
        cosmetic,
        type: 'PURCHASE',
        itemType: 'COSMETIC',
        amount: cosmetic.price,
        balanceBefore,
        balanceAfter: user.vbucksBalance,
      });
      await manager.save(tx);

      return {
        message: 'Compra realizada com sucesso.',
        balance: user.vbucksBalance,
      };
    });
  }


  private async purchaseBundle(userId: string, bundleId: string) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const bundle = await manager.findOne(Bundle, {
        where: { id: bundleId },
        relations: ['cosmetics'],
      });
      if (!bundle) throw new NotFoundException('Bundle not found');

      if (!bundle.cosmetics || bundle.cosmetics.length === 0) {
        throw new BadRequestException('Bundle sem cosméticos vinculados.');
      }

      if (user.vbucksBalance < bundle.price) {
        throw new BadRequestException('Saldo insuficiente de v-bucks.');
      }

      const balanceBefore = user.vbucksBalance;
      user.vbucksBalance -= bundle.price;
      await manager.save(user);

      let newItems = 0;

      for (const cosmetic of bundle.cosmetics) {
        const alreadyOwned = await manager.count(UserCosmetic, {
          where: {
            user: { id: user.id },
            cosmetic: { id: cosmetic.id },
          },
        });

        if (alreadyOwned === 0) {
          const userCosmetic = manager.create(UserCosmetic, {
            user,
            cosmetic,
            source: 'BUNDLE',
          });
          await manager.save(userCosmetic);
          newItems++;
        }
      }

      const tx = manager.create(Transaction, {
        user,
        type: 'PURCHASE',
        itemType: 'BUNDLE', 
        amount: bundle.price,
        balanceBefore,
        balanceAfter: user.vbucksBalance,
      });
      await manager.save(tx);

      return {
        message: 'Bundle comprado com sucesso.',
        balance: user.vbucksBalance,
        bundleId: bundle.id,
        itemsGranted: newItems,
      };
    });
  }


  async refund(userId: string, dto: RefundDto) {
    const { cosmeticId } = dto;

    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');

      const cosmetic = await manager.findOne(Cosmetic, {
        where: { id: cosmeticId },
      });
      if (!cosmetic) throw new NotFoundException('Cosmetic not found');

      const userCosmetic = await manager.findOne(UserCosmetic, {
        where: { user: { id: user.id }, cosmetic: { id: cosmetic.id } },
      });

      if (!userCosmetic) {
        throw new BadRequestException(
          'Usuário não possui esse cosmético para devolução.',
        );
      }

      const balanceBefore = user.vbucksBalance;
      user.vbucksBalance += cosmetic.price;

      await manager.remove(userCosmetic);
      await manager.save(user);

      const tx = manager.create(Transaction, {
        user,
        cosmetic,
        type: 'REFUND',
        itemType: 'COSMETIC',
        amount: -cosmetic.price,
        balanceBefore,
        balanceAfter: user.vbucksBalance,
      });
      await manager.save(tx);

      return {
        message: 'Devolução realizada com sucesso.',
        balance: user.vbucksBalance,
      };
    });
  }
}
