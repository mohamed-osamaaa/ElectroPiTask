import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMemberDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
