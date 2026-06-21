import type { Logger } from "@nestjs/common";

type SafeLogLevel = "log" | "warn";

export function logSafely(logger: Logger, level: SafeLogLevel, message: string): void {
  try {
    logger[level](message);
  } catch {
    // Logging must never affect application behavior.
  }
}
