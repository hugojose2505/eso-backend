import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/domain/entities/user.entity';
import { PublicListUsersDto } from '../dto/users/users-list.dto';

type PublicUserProfile = {
  id: string;
  name: string;
  email: string;
  vbucksBalance: number;
  createdAt: Date;
};

@Injectable()
export class PublicUsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async list(dto: PublicListUsersDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [items, total] = await this.usersRepo.findAndCount({
      select: {
        id: true,
        name: true,
        email: true,
        vbucksBalance: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data: PublicUserProfile[] = items.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      vbucksBalance: u.vbucksBalance,
      createdAt: u.createdAt,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
