import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cosmetic } from 'src/domain/entities/cosmetic.entity';
import { CreateBundleDto } from '../dto/bundle/bundle.dto';
import { Bundle } from 'src/domain/entities/bundle.entity';

@Injectable()
export class BundleService {
  constructor(
    @InjectRepository(Bundle)
    private readonly bundleRepo: Repository<Bundle>,
    @InjectRepository(Cosmetic)
    private readonly cosmeticRepo: Repository<Cosmetic>,
  ) {}

  async findAll() {
    return this.bundleRepo.find({
      relations: ['cosmetics'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const bundle = await this.bundleRepo.findOne({
      where: { id },
      relations: ['cosmetics'],
    });

    if (!bundle) {
      throw new NotFoundException('Bundle não encontrado');
    }

    return bundle;
  }

  async create(dto: CreateBundleDto) {
    const cosmetics = await this.cosmeticRepo.find({
      where: { id: In(dto.cosmeticIds) },
    });

    if (cosmetics.length !== dto.cosmeticIds.length) {
      throw new BadRequestException(
        'Alguns cosméticos informados não foram encontrados.',
      );
    }

    const bundle = this.bundleRepo.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      isPromo: true,
      cosmetics,
    });

    return this.bundleRepo.save(bundle);
  }
}
