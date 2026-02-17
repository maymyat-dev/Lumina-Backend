import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis as IORedis } from 'ioredis';

import { TelegramService } from '../lib/helpers/telegram-noti';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    TelegramService,
    {
      provide: 'REDIS',
      useFactory: (
        configService: ConfigService,
        telegramService: TelegramService
      ) => {
        const logger = new Logger('Redis');
        const redisHost = configService.getOrThrow<string>('REDIS_HOST');
        const redis = new IORedis(redisHost, {
          maxRetriesPerRequest: null, // required by BullMQ
          retryStrategy: (times) => {
            const delay = 10000; // retry every 10s
            logger.warn(`♻️ Redis retry attempt #${times}, retrying in ${delay}ms`);
            return delay;
          },
        });

        redis.on('connect', () => {
          const msg = '🔌 Redis: connecting...';
          logger.debug(msg);
          telegramService.sendMessage(msg).catch(() => { });
        });

        redis.on('ready', () => {
          const msg = '✅ Redis: connected & ready';
          logger.debug(msg);
          telegramService.sendMessage(msg).catch(() => { });
        });

        redis.on('error', (err) => {
          const msg = `❌ Redis error: ${err.message}`;
          logger.error(msg);
          telegramService.sendMessage(msg).catch(() => { });
        });

        redis.on('close', () => {
          const msg = '⚠️ Redis: connection closed';
          logger.warn(msg);
          telegramService.sendMessage(msg).catch(() => { });
        });

        redis.on('reconnecting', (time) => {
          const msg = `♻️ Redis: reconnecting in ${time}ms`;
          logger.warn(msg);
          telegramService.sendMessage(msg).catch(() => { });
        });

        redis.on('end', () => {
          const msg = '⛔ Redis: connection ended';
          logger.warn(msg);
          telegramService.sendMessage(msg).catch(() => { });
        });

        logger.debug('✅ REDIS CLIENT CONNECT SUCCESSFULLY');
        return redis;
      },
      inject: [ConfigService, TelegramService],
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
