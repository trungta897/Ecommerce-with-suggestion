import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;
    const url = req.url;
    const userAgent = req.get('user-agent') || '';

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const statusCode = res.statusCode;
          const contentLength = res.get('content-length') || '';

          this.logger.log(
            `${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${
              Date.now() - now
            }ms`,
          );
        },
        error: (err: Error) => {
          this.logger.error(
            `${method} ${url} - ${userAgent} ${Date.now() - now}ms - Error: ${err.message}`,
          );
        },
      }),
    );
  }
}
