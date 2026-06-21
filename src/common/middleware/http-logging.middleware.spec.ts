import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { httpLoggingMiddleware } from "./http-logging.middleware";

describe("httpLoggingMiddleware", () => {
  let logSpy: jest.SpiedFunction<Logger["log"]>;
  let finishHandler: () => void;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-21T10:00:00.000Z"));
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("logs an authenticated request once after the response finishes", () => {
    const request = {
      method: "POST",
      originalUrl: "/reservations",
      user: { id: 1 },
    } as unknown as Request;
    const response = {
      statusCode: 201,
      once: (_event: string, handler: () => void) => {
        finishHandler = handler;
      },
    } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;

    httpLoggingMiddleware(request, response, next);
    jest.advanceTimersByTime(42);
    finishHandler();

    expect(next).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith("[HTTP] POST /reservations 201 42ms userId=1");
  });

  it("uses anonymous when request user data is missing", () => {
    const request = {
      method: "GET",
      originalUrl: "/restaurants",
    } as Request;
    const response = {
      statusCode: 200,
      once: (_event: string, handler: () => void) => {
        finishHandler = handler;
      },
    } as unknown as Response;

    httpLoggingMiddleware(request, response, jest.fn());
    finishHandler();

    expect(logSpy).toHaveBeenCalledWith("[HTTP] GET /restaurants 200 0ms userId=anonymous");
  });
});
