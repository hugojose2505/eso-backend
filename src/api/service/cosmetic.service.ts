import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';
import { Repository } from 'typeorm';
import { ListCosmeticsDto } from '../dto/cosmetic/list-cosmetic.dto';


@Injectable()
export class CosmeticsService {
  constructor(
    @InjectRepository(Cosmetic)
    private readonly cosmeticsRepo: Repository<Cosmetic>,
  ) {}

  async list(dto: ListCosmeticsDto, userId?: string) {
    const {
      search,
      type,
      rarity,
      startDate,
      endDate,
      onlyNew,
      onlyOnSale,
      onlyPromo,
      page,
      limit,
    } = dto;

    const qb = this.cosmeticsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.userCosmetics', 'uc')
      .leftJoin('uc.user', 'u');

    if (search) {
      qb.andWhere('LOWER(c.name) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    if (type) qb.andWhere('c.type = :type', { type });
    if (rarity) qb.andWhere('c.rarity = :rarity', { rarity });

    if (startDate) qb.andWhere('c.releaseDate >= :startDate', { startDate });
    if (endDate) qb.andWhere('c.releaseDate <= :endDate', { endDate });

    if (onlyNew === 'true') qb.andWhere('c.isNew = true');
    if (onlyOnSale === 'true') qb.andWhere('c.isOnSale = true');
    if (onlyPromo === 'true') qb.andWhere('c.isPromo = true');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    const data = items.map((c) => {
      const isOwned = userId
        ? c.userCosmetics?.some((uc) => (uc as any).user?.id === userId)
        : false;

      const { userCosmetics, ...rest } = c;
      return { ...rest, isOwned };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const cosmetic = await this.cosmeticsRepo.findOne({
      where: { id },
      relations: ['userCosmetics', 'userCosmetics.user'],
    });

    if (!cosmetic) throw new NotFoundException('Cosmetic not found');

    const isOwned = userId
      ? cosmetic.userCosmetics?.some((uc) => uc.user.id === userId)
      : false;

    const { userCosmetics, ...rest } = cosmetic;
    return { ...rest, isOwned };
  }
}
