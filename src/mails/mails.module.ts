import { Global, Module } from '@nestjs/common';

import { TelegramService } from '../lib/helpers/telegram-noti';

import { MailsService } from './mails.service';

@Global()
@Module({
  controllers: [],
  providers: [MailsService, TelegramService],
  exports: [MailsService],
})
export class MailsModule {}
