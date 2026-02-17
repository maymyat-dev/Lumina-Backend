import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaClient } from '../../prisma/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readReplicas } from '@prisma/extension-read-replicas'

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private static instance: ReturnType<typeof PrismaService.createClient>
  public readonly client: ReturnType<typeof PrismaService.createClient>

  constructor(private readonly configService: ConfigService) {
    if (!PrismaService.instance) {
      PrismaService.instance =
        PrismaService.createClient(this.configService)
    }

    this.client = PrismaService.instance
  }

  private static createClient(configService: ConfigService) {
    // ✅ Primary adapter
    const primaryAdapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    })

    const baseClient = new PrismaClient({
      adapter: primaryAdapter,
      log: ['error'],
    })

    // ✅ Replica adapter
    const replicaAdapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('READ_DATABASE_URL'),
    })

    const replicaClient = new PrismaClient({
      adapter: replicaAdapter,
    })

    return baseClient.$extends(
      readReplicas({
        replicas: [replicaClient],
      }),
    )
  }

  async onModuleDestroy() {
    await this.client.$disconnect()
  }
}
