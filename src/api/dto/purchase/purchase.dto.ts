import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseDto {
  @IsOptional()
  @IsUUID()
  cosmeticId?: string;

  @IsOptional()
  @IsUUID()
  bundleId?: string;

}
