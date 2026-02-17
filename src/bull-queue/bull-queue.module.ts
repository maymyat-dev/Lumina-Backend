import { BullModule } from '@nestjs/bullmq';
import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';

import { TelegramService } from '../lib/helpers/telegram-noti';
import { MailsService } from '../mails/mails.service';

import { OTPEmailQueueProcessor } from './otp-mail.queue';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: ['REDIS'],
      useFactory: (redis: Redis) => ({
        connection: redis,
      }),
    }),
    BullModule.registerQueue({
      name: 'task-otp-email-queue',
      defaultJobOptions: {
        attempts: 8,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [OTPEmailQueueProcessor, TelegramService, MailsService],
  exports: [BullModule],
})
export class BullMQModule {}
