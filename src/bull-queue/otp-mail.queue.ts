import { Processor, WorkerHost } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';

import { OTP_TYPE } from '../auth/entities/auth.entity';
import { TelegramService } from '../lib/helpers/telegram-noti';
import { MAIL_TEMPLATES_NAMES } from '../lib/types/email.type';
import { MailsService } from '../mails/mails.service';

@Processor('task-otp-email-queue')
export class OTPEmailQueueProcessor extends WorkerHost {
  private readonly senderName: string;
  private readonly senderEmail: string;

  constructor(
    private readonly mailsService: MailsService,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {
    super();
    this.senderName = this.configService.getOrThrow<string>('SENDER_NAME');
    this.senderEmail = this.configService.getOrThrow<string>('SENDER_EMAIL');
  }

  async process(
    job: Job<{
      type: OTP_TYPE;
      to: string;
      otp: string;
      expire_time: string;
      verify_link: string;
    }>,
  ): Promise<{ success: boolean }> {
    console.log(`Job started: id=${job.id}, name=${job.name}`);

    if (job.name !== 'task-otp-email') {
      return { success: true };
    }

    try {
      const mailSubject =
        job.data.type === OTP_TYPE.REGISTER
          ? 'Register OTP Email'
          : 'Reset your account password';

      const mailTemplate =
        job.data.type === OTP_TYPE.REGISTER
          ? MAIL_TEMPLATES_NAMES.REGISTER_OTP
          : MAIL_TEMPLATES_NAMES.FORGET_PASSWORD_OTP;

      if(job.data.type === OTP_TYPE.REGISTER) {
        const emailSent = await this.mailsService.registerOTPMail({
          mailData: {
            receivers: [{ email: job.data.to }],
            subject: mailSubject,
            params: {
              email: job.data.to,
              otp_code: job.data.otp,
              expire_time: job.data.expire_time,
              verify_link: job.data.verify_link,
            },
            sender: {
              name: this.senderName,
              email: this.senderEmail,
            },
          },
          template: mailTemplate,
        });

        if (!emailSent) {
          throw new Error('Failed to send otp email');
        }
      } else {
        // const emailSent = await this.mailsService.forgetPasswordMail({
        //   mailData: {
        //     receivers: [{ email: job.data.to }],
        //     subject: mailSubject,
        //     params: {
        //       email: job.data.to,
        //       otp_code: job.data.otp,
        //       expire_time: job.data.expire_time,
        //       verify_link: job.data.verify_link,
        //     },
        //     sender: {
        //       name: this.senderName,
        //       email: this.senderEmail,
        //     },
        //   },
        //   template: mailTemplate,
        // });

        // if (!emailSent) {
        //   throw new Error('Failed to send otp email');
        // }
      }

      await this.telegramService.sendMessage('✅ OTP email sent successfully');

      return { success: true };
    } catch (error: unknown) {
      console.error(`❌ otp-email job failed (jobId=${job.id})`, error);

      await this.telegramService.sendMessage(
        `❌ otp-email failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw error instanceof Error ? error : new Error('OTP email job failed');
    }
  }
}
