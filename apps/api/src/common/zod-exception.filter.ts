import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';

/**
 * Controllers validate bodies with `Schema.parse(body)`. A ZodError is not an
 * HttpException, so without this filter NestJS reports malformed input as a 500.
 * Map it to a 400 that carries the field-level issues, so clients (e.g. the
 * login modal) can show which field was wrong.
 */
@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Bad Request',
      message: "Yuborilgan ma'lumot noto'g'ri",
      issues: exception.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
}
