import { IsNotEmpty, IsUUID } from 'class-validator';

export class RefundDto {
  @IsUUID()
  @IsNotEmpty()
  cosmeticId: string;
}
