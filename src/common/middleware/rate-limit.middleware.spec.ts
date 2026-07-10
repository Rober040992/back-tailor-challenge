import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, Response } from "express";
import { createRateLimitMiddleware } from "./rate-limit.middleware";

type MockResponse = {
  set: jest.Mock;
  status: jest.Mock;
  json: jest.Mock;
};

function createRequest(ip = "127.0.0.1", originalUrl = "/restaurants"): Request {
  return {
    ip,
    originalUrl,
    socket: {
      remoteAddress: ip,
    },
  } as unknown as Request;
}

function createResponse(): MockResponse {
  const response: MockResponse = {
    set: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };

  response.set.mockReturnValue(response);
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
}

function runMiddleware(
  middleware: ReturnType<typeof createRateLimitMiddleware>,
  request: Request = createRequest(),
): {
  next: jest.Mock;
  response: MockResponse;
} {
  const response = createResponse();
  const next = jest.fn();

  middleware(request, response as unknown as Response, next as NextFunction);

  return { next, response };
}

describe("createRateLimitMiddleware", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-10T10:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows 30 requests per client IP", () => {
    const middleware = createRateLimitMiddleware();

    for (let index = 0; index < 30; index += 1) {
      const { next, response } = runMiddleware(middleware);

      expect(next).toHaveBeenCalledTimes(1);
      expect(response.status).not.toHaveBeenCalled();
    }
  });

  it("blocks request 31 for 2 minutes", () => {
    const middleware = createRateLimitMiddleware();

    for (let index = 0; index < 30; index += 1) {
      runMiddleware(middleware);
    }

    const { next, response } = runMiddleware(middleware, createRequest("127.0.0.1", "/auth/login"));

    expect(next).not.toHaveBeenCalled();
    expect(response.set).toHaveBeenCalledWith("Retry-After", "120");
    expect(response.status).toHaveBeenCalledWith(429);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        error: "TOO_MANY_REQUESTS",
        path: "/auth/login",
      }),
    );
  });

  it("does not extend the penalty when blocked requests keep arriving", () => {
    const middleware = createRateLimitMiddleware();

    for (let index = 0; index < 31; index += 1) {
      runMiddleware(middleware);
    }

    jest.setSystemTime(new Date("2026-07-10T10:01:00.000Z"));

    const blockedRetry = runMiddleware(middleware);

    expect(blockedRetry.next).not.toHaveBeenCalled();
    expect(blockedRetry.response.set).toHaveBeenCalledWith("Retry-After", "60");

    jest.setSystemTime(new Date("2026-07-10T10:02:01.000Z"));

    const afterPenalty = runMiddleware(middleware);

    expect(afterPenalty.next).toHaveBeenCalledTimes(1);
    expect(afterPenalty.response.status).not.toHaveBeenCalled();
  });

  it("tracks different client IPs independently", () => {
    const middleware = createRateLimitMiddleware();

    for (let index = 0; index < 31; index += 1) {
      runMiddleware(middleware, createRequest("127.0.0.1"));
    }

    const differentIp = runMiddleware(middleware, createRequest("127.0.0.2"));

    expect(differentIp.next).toHaveBeenCalledTimes(1);
    expect(differentIp.response.status).not.toHaveBeenCalled();
  });
});
