import { IsNotEmpty, IsString } from 'class-validator';

export class UserAuthDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}