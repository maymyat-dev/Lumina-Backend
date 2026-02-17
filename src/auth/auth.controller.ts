import { Controller, Post, Body, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserAuthDto } from './dto/auth.dto';
import * as authEntity from './entities/auth.entity';
import { JwtUserAuthGuard } from './guard/jwt-user-auth.guard';
import { ConfigService } from '@nestjs/config';
import { SkipInterceptor } from 'src/lib/decorators/skip-interceptor';
import { GoogleOauthGuard } from './guard/google-auth.guard';
import express from 'express';
import { OTPRequestDto, OTPUserUpdateDto, OTPVerifyDto } from './dto/otp.dto';

@Controller('auth')
export class AuthController {
  private readonly userFEUrl: string;
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {
    this.userFEUrl = this.configService.getOrThrow<string>('USER_FE_URL');
  }

  @Post('otp-request')
  OtpRequest(@Body() otpEmail: OTPRequestDto) {
    return this.authService.otpRequest(otpEmail);
  }

  @Post('otp-verify')
  OtpVerify(@Body() data: OTPVerifyDto) {
    return this.authService.verifyOtp(data);
  }

  @Post('sign-up')
  updateOtpVerifiedUser(@Body() data: OTPUserUpdateDto) {
    return this.authService.updateOtpUser(data);
  }

  @Post('login')
  login(@Body() body: UserAuthDto) {
    return this.authService.login(body);
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleLogin() {
    return { message: 'Redirecting to login page' };
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  @SkipInterceptor()
  googleLoginCallback(@Req() req: any, @Res() res: express.Response) {
    try {
      const frontendRedirect = this.userFEUrl + `social-auth-success?token=${req.user.accessToken}`;

      return res.redirect(frontendRedirect);
    } catch (error) {
      console.log(error);
    }
  }

  @Get('logout')
  @UseGuards(JwtUserAuthGuard)
  userLogout(@Req() req: authEntity.UserAuthRequest) {
    const authHeader = req.headers['authorization'] as string;
    const token = authHeader?.split(' ')[1];
    const { user_id } = req.user;
    return this.authService.userLogout(user_id, token);
  }
}
