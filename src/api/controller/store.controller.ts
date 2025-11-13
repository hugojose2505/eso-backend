import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { StoreService } from '../service/store.service';
import { PurchaseDto } from '../dto/purchase/purchase.dto';
import { RefundDto } from '../dto/refound/refound.dto';

@Controller('store')
@UseGuards(AuthGuard('jwt'))
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post('purchase')
  purchase(@Req() req: any, @Body() dto: PurchaseDto) {
    return this.storeService.purchase(req.user.id, dto);
  }

  @Post('refund')
  refund(@Req() req: any, @Body() dto: RefundDto) {
    return this.storeService.refund(req.user.id, dto);
  }
}
