import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisModule } from './redis/redis.module';
import { FileModule } from './file/file.module';
import { BullMQModule } from './bull-queue/bull-queue.module';
import { MailsModule } from './mails/mails.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 50,
      },
    ]),
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    RedisModule,
    AuthModule,
    FileModule,
    BullMQModule,
    PrismaModule,
    MailsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
