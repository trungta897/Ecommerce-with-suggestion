import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Lỗi cơ sở dữ liệu (Database Error)';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = 'Dữ liệu đã tồn tại (Unique constraint failed)';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Không tìm thấy dữ liệu (Record not found)';
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Lỗi ràng buộc khóa ngoại (Foreign key constraint failed)';
        break;
      default:
        break;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: exception.name,
    });
  }
}
