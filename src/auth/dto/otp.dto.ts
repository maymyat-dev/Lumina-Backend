import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class OTPRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[^+@]+@[^@]+\.[^@]+$/, {
    message: 'Email alias (+) is not allowed',
  })
  email: string;
}

export class OTPVerifyDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[^+@]+@[^@]+\.[^@]+$/, {
    message: 'Email alias (+) is not allowed',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  otp_code: string;
}

export class OTPUserUpdateDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[^+@]+@[^@]+\.[^@]+$/, {
    message: 'Email alias (+) is not allowed',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(30)
  lastName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  password: string;
}