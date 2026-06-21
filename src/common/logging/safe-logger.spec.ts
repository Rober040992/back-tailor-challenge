import { describe, expect, it, jest } from "@jest/globals";
import { Logger } from "@nestjs/common";
import { logSafely } from "./safe-logger";

describe("logSafely", () => {
  it("does not propagate logger failures", () => {
    const logger = new Logger("Test");
    jest.spyOn(logger, "log").mockImplementation(() => {
      throw new Error("Logging failed");
    });

    expect(() => logSafely(logger, "log", "message")).not.toThrow();
  });
});
