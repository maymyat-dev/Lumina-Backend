import { HttpException, HttpStatus, Logger } from '@nestjs/common';

const logger = new Logger('ErrorResponse');

export function ErrorResponse(
  error: unknown,
  fallbackMessage = 'Internal server error',
  fallbackStatus = HttpStatus.BAD_REQUEST,
): never {
  const isProd = process.env.STAGE === 'prod';

  if (error instanceof HttpException) {
    if (isProd) {
      throw new HttpException(fallbackMessage, error.getStatus());
    }
    throw error;
  }

  if (error instanceof Error) {
    if (!isProd) {
      logger.error(error.stack || error.message);
      throw new HttpException(error.message, fallbackStatus);
    }
    throw new HttpException(fallbackMessage, fallbackStatus);
  }

  logger.error(error);
  throw new HttpException(fallbackMessage, fallbackStatus);
}
