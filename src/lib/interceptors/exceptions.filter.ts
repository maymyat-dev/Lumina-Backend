import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { ApiResponse } from './responses.interceptor';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor() {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let devMessage: Record<string, unknown> | null = null;
    let errorData: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      message = exception.message;

      if (typeof responseBody === 'object' && responseBody !== null) {
        const responseObj = responseBody as Record<string, unknown>;
        errorData = responseObj.data ?? null;
        devMessage = responseObj;
      } else {
        devMessage = { message: String(responseBody) };
      }
    } else {
      devMessage = { message: String(exception) };
    }

    const errorResponse: ApiResponse<null> = {
      meta: {
        success: false,
        message: message,
        devMessage: devMessage,
      },
      body: errorData as null,
    };

    response.status(status).json(errorResponse);
  }
}
