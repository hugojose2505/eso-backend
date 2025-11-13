import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../service/user.service';

@Controller('me')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('inventory')
  getInventory(@Req() req: any) {
    return this.usersService.getInventory(req.user.id);
  }

  @Get('transactions')
  getTransactions(@Req() req: any) {
    return this.usersService.getTransactions(req.user.id);
  }
}
