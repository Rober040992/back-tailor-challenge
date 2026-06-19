import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { createValidationException } from "./common/errors/validation-error.factory";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

export function configureApplication(app: INestApplication): void {
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createValidationException,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
