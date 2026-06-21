import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ArgumentsHost, ConflictException, Logger } from "@nestjs/common";
import type { Request, Response } from "express";
import { HttpExceptionFilter } from "./http-exception.filter";

describe("HttpExceptionFilter logging", () => {
  let filter: HttpExceptionFilter;
  let warnSpy: jest.SpiedFunction<Logger["warn"]>;
  let errorSpy: jest.SpiedFunction<Logger["error"]>;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    filter = new HttpExceptionFilter();
    json = jest.fn();
    status = jest.fn(() => ({ json }));

    const request = {
      method: "POST",
      originalUrl: "/reservations",
    } as Request;
    const response = { status } as unknown as Response;

    host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
        getNext: () => undefined,
      }),
    } as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs controlled errors without a stack trace", () => {
    filter.catch(new ConflictException("Capacity conflict"), host);

    expect(warnSpy).toHaveBeenCalledWith("[ERROR] POST /reservations 409 Capacity conflict");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(409);
  });

  it("logs unexpected errors with their stack trace", () => {
    const exception = new Error("Database unavailable");

    filter.catch(exception, host);

    expect(errorSpy).toHaveBeenCalledWith(
      "[ERROR] POST /reservations 500 Internal server error.",
      exception.stack,
    );
    expect(status).toHaveBeenCalledWith(500);
  });
});
