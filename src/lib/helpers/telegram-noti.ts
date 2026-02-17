import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly chatId: string;

  constructor(
    private readonly configService: ConfigService
  ) {
    this.chatId = this.configService.getOrThrow<string>('TELEGRAM_CHANNEL_ID');
    this.botToken = this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
  }

  async sendMessage(message: string) {
    const url = `https://api.telegram.org/${this.botToken}/sendMessage`;
    const body = {
      chat_id: this.chatId,
      text: `\`\`\`json\n${JSON.stringify(message, null, 2)}\n\`\`\``,
      parse_mode: 'MarkdownV2',
    };

    try {
      const response = await axios.post<TelegramResponse>(url, body, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = response.data;
      if (!data.ok) {
        this.logger.error('Failed to send message', data);
      }
    } catch (error) {
      this.logger.error('Error sending message', error);
    }
  }
}
