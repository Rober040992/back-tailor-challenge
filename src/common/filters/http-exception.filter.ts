import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
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
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const normalizedResponse = this.normalizeResponse(exceptionResponse);
    const publicMessage =
      statusCode === 500 ? "Internal server error." : normalizedResponse.message;

    this.logError(request, statusCode, publicMessage, exception);

    response.status(statusCode).json({
      statusCode,
      error: HttpStatus[statusCode] ?? "INTERNAL_SERVER_ERROR",
      message: publicMessage,
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
      const message = Array.isArray(response.message)
        ? response.message.join(", ")
        : response.message;

      return {
        message: message ?? "Request failed.",
        details: response.details,
      };
    }

    return { message: "Request failed." };
  }

  private logError(
    request: Request,
    statusCode: number,
    message: string,
    exception: unknown,
  ): void {
    try {
      const logMessage = `[ERROR] ${request.method ?? "UNKNOWN"} ${request.originalUrl ?? request.url ?? "/"} ${statusCode} ${message}`;

      if (statusCode >= 500) {
        this.logger.error(logMessage, exception instanceof Error ? exception.stack : undefined);
        return;
      }

      this.logger.warn(logMessage);
    } catch {
      // Logging must never change the API error flow.
    }
  }

  private isExceptionResponse(value: unknown): value is ExceptionResponse {
    return typeof value === "object" && value !== null;
  }
}
