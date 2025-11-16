import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BundleService } from '../service/bundle.service';
import { CreateBundleDto } from '../dto/bundle/bundle.dto';

@Controller('bundles')
export class BundleController {
  constructor(private readonly bundleService: BundleService) {}

  @Get()
  findAll() {
    return this.bundleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bundleService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBundleDto) {
    return this.bundleService.create(dto);
  }
}
