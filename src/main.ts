import { Logger, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';

import { ResponseInterceptor } from './lib/interceptors/responses.interceptor';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './lib/interceptors/exceptions.filter';


async function bootstrap() {
  const logger = new Logger(Logger.name);
  const PORT = process.env.PORT || 8000;

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'debug', 'log'] });

  app.setGlobalPrefix('api', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
    credentials: true,
  });
  app.useGlobalInterceptors(new ResponseInterceptor(new Reflector()));
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));
  app.useGlobalFilters(new AllExceptionsFilter());
  
  app.enableShutdownHooks();

  await app.listen(PORT);
  logger.debug(`🚀 API is running on: http://localhost:${PORT}`);
}
void bootstrap();
