import { HttpStatus } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimitMiddleware() {
  const requestsByClient = new Map<string, RateLimitEntry>();

  return function rateLimitMiddleware(
    request: Request,
    response: Response,
    next: NextFunction,
  ): void {
    const now = Date.now();
    const clientKey = getClientKey(request);
    const existingEntry = requestsByClient.get(clientKey);
    const entry =
      existingEntry === undefined || existingEntry.resetAt <= now
        ? { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS }
        : existingEntry;

    entry.count += 1;
    requestsByClient.set(clientKey, entry);

    if (entry.count <= RATE_LIMIT_MAX_REQUESTS) {
      next();
      return;
    }

    response.status(HttpStatus.TOO_MANY_REQUESTS).json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: "TOO_MANY_REQUESTS",
      message: "Too many requests.",
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  };
}

function getClientKey(request: Request): string {
  return request.ip ?? request.socket.remoteAddress ?? "unknown";
}
