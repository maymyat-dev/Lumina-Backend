import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { unset } from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MetaData {
  success: boolean;
  message: string;
  devMessage: string | Record<string, unknown> | null; // Allow devMessage to be an object
}

export interface ApiResponse<T> {
  meta: MetaData;
  body: T | null;
}

interface ResponseData {
  message?: string;
  devMessage?: string;
  [key: string]: unknown;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const skipInterceptor = this.reflector.get<boolean>('skipInterceptor', context.getHandler());

    if (skipInterceptor) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => {
        const responseData = data as ResponseData;
        const message = responseData.message || 'Operation successful';
        const devMessage = responseData.devMessage || 'Operation successful';

        unset(responseData, 'message');
        unset(responseData, 'devMessage');

        return {
          meta: {
            success: true,
            message,
            devMessage: devMessage || null,
          },
          body: data,
        };
      }),
    );
  }
}
