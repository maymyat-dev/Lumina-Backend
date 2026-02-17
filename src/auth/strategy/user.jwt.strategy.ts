import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { JwtPayloadUser } from '../entities/auth.entity';
import { Request } from 'express';
import { createHash } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class JwtStrategyUser extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(
    configService: ConfigService,
    @Inject('REDIS')
    private readonly redisClient: Redis
  ) {
    super({
      secretOrKey: configService.getOrThrow<string>('USER_JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayloadUser) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) {
      throw new HttpException('Unauthorized. No token.', HttpStatus.UNAUTHORIZED);
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    const redisKeyPattern = `user:${payload.user_id}:token:${tokenHash}*`;
    const exists = await this.redisClient.keys(redisKeyPattern);

    if (exists.length === 0) {
      throw new HttpException('Token invalid or logged out', HttpStatus.UNAUTHORIZED);
    }

    return { user_id: payload.user_id };
  }
}
