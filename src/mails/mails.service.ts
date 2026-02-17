import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Handlebars from 'handlebars';
import { createTransport, SentMessageInfo, Transporter } from 'nodemailer';

import { TelegramService } from '../lib/helpers/telegram-noti';

import { SendMailByNodemailerData } from './dto/mails.interface';

@Injectable()
export class MailsService {
  private transporter: Transporter<SentMessageInfo>;
  private readonly reply_email: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {
    this.reply_email = this.configService.getOrThrow<string>('REPLY_EMAIL');

    this.transporter = createTransport({
      from: `"${this.configService.getOrThrow<string>('SENDER_NAME')}" <${this.configService.getOrThrow<string>('SENDER_EMAIL')}>`,
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_ADDRESS'),
        pass: this.configService.getOrThrow<string>('MAIL_PWD'),
      },
      headers: {
        'X-Entity-Ref-ID': randomUUID(),
        'X-Mailer': 'Nodemailer',
      },
    });

    this.registerHandlebarsHelpers();
  }

  private registerHandlebarsHelpers(): void {
    Handlebars.registerHelper(
      'isNotLast',
      function (
        index: number,
        array: unknown[],
        options: Handlebars.HelperOptions,
      ): string {
        if (!Array.isArray(array)) {
          return options.inverse(this);
        }

        return index < array.length - 1
          ? options.fn(this)
          : options.inverse(this);
      },
    );
  }

  async registerOTPMail(data: SendMailByNodemailerData): Promise<boolean> {
    try {
      const { mailData, template } = data;
      const { receivers, subject, params, sender } = mailData;

      const templatePath = path.resolve(
        process.cwd(),
        'src',
        'mails',
        'mail-templates',
        `${template}.hbs`,
      );

      const emailTemplateSource: string = fs.readFileSync(templatePath, 'utf8');

      const compiledTemplate = Handlebars.compile(
        emailTemplateSource,
      ) as Handlebars.TemplateDelegate<Record<string, unknown>>;

      const htmlContent: string = compiledTemplate({
        ...params,
        otp_code: params.otp_code.split(''),
      });
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */

      const recipientList: string[] = receivers.map((r) => r.email);

      const sendResult: SentMessageInfo = await this.transporter.sendMail({
        from: `"${sender.name}" <${sender.email}>`,
        to: recipientList,
        subject,
        html: htmlContent,
        replyTo: this.reply_email,
      });

      await this.telegramService.sendMessage(
        `Email sent successfully: ${JSON.stringify(sendResult)}`,
      );

      return true;
    } catch (error: unknown) {
      await this.telegramService.sendMessage(
        `ERROR SENDING EMAIL: ${JSON.stringify(error)}`,
      );
      console.error('Error sending email with Nodemailer:', error);
      return false;
    }
  }
}
