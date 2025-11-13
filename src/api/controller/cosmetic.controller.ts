import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { CosmeticsService } from '../service/cosmetic.service';
import { ListCosmeticsDto } from '../dto/cosmetic/list-cosmetic.dto';


@Controller('cosmetics')
export class CosmeticsController {
  constructor(private readonly cosmeticsService: CosmeticsService) {}

  @Get()
  list(@Query() query: ListCosmeticsDto, @Req() req: any) {
    const userId = req.user?.id; 
    return this.cosmeticsService.list(query, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.cosmeticsService.findOne(id, userId);
  }
}
