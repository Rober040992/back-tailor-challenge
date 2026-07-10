import { HttpStatus } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PENALTY_MS = 120_000;
const RATE_LIMIT_MAX_REQUESTS = 30;

interface RateLimitEntry {
  count: number;
  windowResetAt: number;
  blockedUntil?: number;
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
    let entry = requestsByClient.get(clientKey);

    if (entry?.blockedUntil !== undefined) {
      if (entry.blockedUntil > now) {
        sendRateLimitResponse(request, response, entry.blockedUntil, now);
        return;
      }

      entry = undefined;
      requestsByClient.delete(clientKey);
    }

    entry =
      entry === undefined || entry.windowResetAt <= now
        ? { count: 0, windowResetAt: now + RATE_LIMIT_WINDOW_MS }
        : entry;

    entry.count += 1;

    if (entry.count <= RATE_LIMIT_MAX_REQUESTS) {
      requestsByClient.set(clientKey, entry);
      next();
      return;
    }

    entry.blockedUntil = now + RATE_LIMIT_PENALTY_MS;
    requestsByClient.set(clientKey, entry);
    sendRateLimitResponse(request, response, entry.blockedUntil, now);
  };
}

function sendRateLimitResponse(
  request: Request,
  response: Response,
  blockedUntil: number,
  now: number,
): void {
  response.set("Retry-After", String(getRetryAfterSeconds(blockedUntil, now)));
  response
    .status(HttpStatus.TOO_MANY_REQUESTS)
    .json({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      error: "TOO_MANY_REQUESTS",
      message: "Too many requests.",
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
}

function getRetryAfterSeconds(blockedUntil: number, now: number): number {
  return Math.max(1, Math.ceil((blockedUntil - now) / 1000));
}

function getClientKey(request: Request): string {
  return request.ip ?? request.socket.remoteAddress ?? "unknown";
}
