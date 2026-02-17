import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UserAuthDto } from './dto/auth.dto';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { createHash, randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { OTPRequestDto, OTPUserUpdateDto, OTPVerifyDto } from './dto/otp.dto';
import moment from 'moment-timezone';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { OTP_TYPE } from './entities/auth.entity';
import { LOGIN_TYPE, Users } from '../../prisma/generated/prisma/client'

@Injectable()
export class AuthService {
  private readonly userFEUrl: string;
  private readonly userSecretKey: string;

  constructor(
    private prisma: PrismaService,
    @Inject('REDIS')
    private readonly redisClient: Redis,
    private configService: ConfigService,
    private jwtService: JwtService,
    @InjectQueue('task-otp-email-queue')
    private readonly bullEmailQueue: Queue,
  ) {
    this.userFEUrl = this.configService.getOrThrow<string>('USER_FE_URL');
    this.userSecretKey = this.configService.getOrThrow<string>('USER_JWT_SECRET');
  }

  private async generateAndSaveAccessToken(user: Users, user_id: string) {
    const access_token: string = this.jwtService.sign({ user_id }, {
      secret: this.userSecretKey,
      expiresIn: '1d',
    });

    const tokenHash = createHash('sha256').update(access_token).digest('hex');
    const redisTokenKey = `user:${user_id}:token:${tokenHash}@${Date.now()}`;
    await this.redisClient.set(redisTokenKey, tokenHash, 'EX', 60 * 60 * 24); // 1 day

    return {
      message: "Login Successful.", 
      data: { 
        email: user.email,
        accessToken: access_token 
      } 
    };
  }

  async generateOtp(length: number) {
    const digits = '0123456789';
    let OTP = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = randomInt(0, digits.length);
      OTP += digits[randomIndex];
    }

    return OTP;
  }

  async otpRequest(data: OTPRequestDto) {
    try {
      const emailExist = await this.prisma.client.users.findFirst({
        where: {
          email: data.email,
          OR: [
            { loginType: LOGIN_TYPE.GOOGLE },
            { loginType: LOGIN_TYPE.EMAIL }
          ]
        },
      });

      if (emailExist) {
        if (emailExist.password) {
          throw new HttpException(
            'Already Registered. Please Login',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (emailExist.otpVerified) {
          return {
            data: {
              otpVerified: emailExist.otpVerified,
            },
            message: 'Otp Verified',
          };
        } else if (emailExist.otpVerified && emailExist.password) {
          return {
            data: {
              otpVerified: emailExist.otpVerified,
            },
            message: 'Please Login',
          };
        } else {
          const otpCode = await this.generateOtp(6);
          const optExpireTime = moment().add(3, 'minute');

          await this.prisma.client.users.update({
            where: {
              id: emailExist.id,
            },
            data: {
              otpCode: otpCode,
              otpExpiry: optExpireTime.format('YYYY-MM-DD HH:mm:ssZ'),
            },
          });

          const verify_link = this.userFEUrl + 'otp' + '?code=' + otpCode + '&email=' + emailExist.email;

          void this.bullEmailQueue.add('task-otp-email', {
            type: OTP_TYPE.REGISTER,
            to: emailExist.email,
            otp: otpCode,
            expire_time: optExpireTime.format('HH:mm DD-MM-YYYY'),
            verify_link
          });

          return {
            data: {
              otpVerified: emailExist.otpVerified,
            },
            message: 'Otp Code Send Successfully',
          };
        }
      } else {
        const otpCode = await this.generateOtp(6);
        const optExpireTime = moment().add(3, 'minute');

        await this.prisma.client.users.create({
          data: {
            email: data.email,
            otpCode: otpCode,
            otpExpiry: optExpireTime.format('YYYY-MM-DD HH:mm:ssZ'),
            loginType: LOGIN_TYPE.EMAIL
          },
        });

        const verify_link = this.userFEUrl + 'otp' + '?code=' + otpCode + '&email=' + data.email;

        void this.bullEmailQueue.add('task-otp-email', {
          type: OTP_TYPE.REGISTER,
          to: data.email,
          otp: otpCode,
          expire_time: optExpireTime.format('HH:mm DD-MM-YYYY'),
          verify_link
        });

        return {
          message: 'Otp Code Send Successfully',
        };
      }
    } catch (error) {
      console.error(error);
      throw error instanceof HttpException
        ? new HttpException(error.message, error.getStatus())
        : new HttpException('Internal server error', HttpStatus.BAD_REQUEST);
    }
  }

  async verifyOtp(otpData: OTPVerifyDto) {
    try {
      const emailExist = await this.prisma.client.users.findFirst({
        where: {
          email: otpData.email,
          loginType: LOGIN_TYPE.EMAIL,
        },
      });

      if (emailExist) {
        const currentTime = moment();
        const expireTime = moment(emailExist.otpExpiry);
        if (currentTime.isAfter(expireTime)) {
          throw new HttpException(
            'Otp Expire.Please Request Again',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
        if (emailExist.otpCode === otpData.otp_code) {
          await this.prisma.client.users.update({
            where: {
              id: emailExist.id,
            },
            data: {
              otpVerified: true,
              otpExpiry: null,
              otpCode: null,
            },
          });
          return {
            data: {
              verified: true,
            },
          };
        } else {
          throw new HttpException(
            'Wrong Otp Code',
            HttpStatus.UNPROCESSABLE_ENTITY,
          );
        }
      } else {
        throw new HttpException(
          'Invalid Request Register First',
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
      throw error instanceof HttpException
        ? new HttpException(error.message, error.getStatus())
        : new HttpException('Internal server error', HttpStatus.BAD_REQUEST);
    }
  }

  async updateOtpUser(body: OTPUserUpdateDto) {
    try {
      const userExist = await this.prisma.client.users.findFirst({
        where: {
          email: body.email,
          loginType: LOGIN_TYPE.EMAIL,
        },
      });
      if (!userExist) {
        throw new HttpException('User is not found', HttpStatus.NOT_FOUND);
      }
      if (!userExist.otpVerified) {
        throw new HttpException(
          'Otp is not verified',
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
      if (userExist.otpVerified && userExist.password) {
        throw new HttpException(
          'Already Registered. Pelase Login',
          HttpStatus.BAD_REQUEST,
        );
      }

      const bcryptPassword = bcrypt.hashSync(body.password, 10);
      const user = await this.prisma.client.users.update({
        where: {
          id: userExist.id,
        },
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          password: bcryptPassword
        }
      });

      return await this.generateAndSaveAccessToken(user, user.id);
    } catch (error) {
      throw error instanceof HttpException
        ? new HttpException(error.message, error.getStatus())
        : new HttpException('Internal server error', HttpStatus.BAD_REQUEST);
    }
  }


  async login(body: UserAuthDto) {
    try {
      const user = await this.prisma.client.users.findFirst({
        where: { email: body.email },
      })

      if (!user) {
        throw new HttpException('Account with this email does not exist. Please sign up.', HttpStatus.NOT_FOUND);
      }

      const passwordIsValid = bcrypt.compareSync(body.password, user.password);

      if (!passwordIsValid) {
        throw new HttpException('Wrong Password', HttpStatus.UNAUTHORIZED);
      }

      return this.generateAndSaveAccessToken(user, user.id);
    } catch (error) {
      throw error instanceof HttpException
        ? new HttpException(error.message, error.getStatus())
        : new HttpException('Internal server error', HttpStatus.BAD_REQUEST);
    }
  }

  async userLogout(user_id: string, token: string) {
    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');

      const redisKeyPattern = `user:${user_id}:token:${tokenHash}*`;
      const exists = await this.redisClient.keys(redisKeyPattern);

      if (exists.length >0) {
        await this.redisClient.del(exists);
      }

      return { message: 'Logout Successful.' }
    } catch (error) {
      throw error instanceof HttpException
        ? new HttpException(error.message, error.getStatus())
        : new HttpException('Internal server error', HttpStatus.BAD_REQUEST);
    }
  }
}
