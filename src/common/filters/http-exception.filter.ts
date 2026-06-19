import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

interface ExceptionResponse {
  message?: string | string[];
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const statusCode = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const normalizedResponse = this.normalizeResponse(exceptionResponse);

    if (!(exception instanceof HttpException)) {
      this.logger.error("Unexpected request error.", exception instanceof Error ? exception.stack : undefined);
    }

    response.status(statusCode).json({
      statusCode,
      error: HttpStatus[statusCode] ?? "INTERNAL_SERVER_ERROR",
      message: statusCode === 500 ? "Internal server error." : normalizedResponse.message,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      ...(normalizedResponse.details !== undefined ? { details: normalizedResponse.details } : {}),
    });
  }

  private normalizeResponse(response: unknown): {
    message: string;
    details?: unknown;
  } {
    if (typeof response === "string") {
      return { message: response };
    }

    if (this.isExceptionResponse(response)) {
      const message = Array.isArray(response.message) ? response.message.join(", ") : response.message;

      return {
        message: message ?? "Request failed.",
        details: response.details,
      };
    }

    return { message: "Request failed." };
  }

  private isExceptionResponse(value: unknown): value is ExceptionResponse {
    return typeof value === "object" && value !== null;
  }
}
