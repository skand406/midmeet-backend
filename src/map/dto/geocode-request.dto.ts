import { IsNotEmpty, IsString } from 'class-validator';

export class GeocodeRequestDto {
  @IsNotEmpty()
  @IsString()
  address: string;
}