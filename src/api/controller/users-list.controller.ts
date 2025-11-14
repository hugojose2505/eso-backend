import { Controller, Get, Query } from '@nestjs/common';
import { PublicUsersService } from '../service/users-list.service';
import { PublicListUsersDto } from '../dto/users/users-list.dto';


@Controller('public/users')
export class PublicUsersController {
  constructor(private readonly publicUsersService: PublicUsersService) {}

  @Get()
  async list(@Query() dto: PublicListUsersDto) {
    return this.publicUsersService.list(dto);
  }
}
