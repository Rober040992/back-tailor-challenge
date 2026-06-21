import { Logger } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

interface RequestUser {
  id?: unknown;
}

interface RequestWithUser extends Request {
  user?: RequestUser;
}

const logger = new Logger("HttpLoggingMiddleware");

export function httpLoggingMiddleware(
  request: RequestWithUser,
  response: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  response.once("finish", () => {
    try {
      const duration = Date.now() - startedAt;
      const statusCode = Number.isInteger(response.statusCode) ? response.statusCode : "unknown";
      const requestUserId = request.user?.id;
      const userId =
        typeof requestUserId === "number" && Number.isInteger(requestUserId)
          ? requestUserId
          : "anonymous";

      logger.log(
        `[HTTP] ${request.method ?? "UNKNOWN"} ${request.originalUrl ?? request.url ?? "/"} ${statusCode} ${duration}ms userId=${userId}`,
      );
    } catch {
      // Logging must never affect the request lifecycle.
    }
  });

  next();
}
