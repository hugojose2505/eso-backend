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
  ) {}

  async purchase(userId: string, dto: PurchaseDto) {
    if (!dto.cosmeticId) {
      throw new BadRequestException('cosmeticId é obrigatório por enquanto.');
    }

    return this.purchaseCosmetic(userId, dto.cosmeticId);
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
