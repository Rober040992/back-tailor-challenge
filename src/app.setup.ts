import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { createValidationException } from "./common/errors/validation-error.factory";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { httpLoggingMiddleware } from "./common/middleware/http-logging.middleware";
import { configureSwagger } from "./common/swagger/swagger.setup";

export function configureApplication(app: INestApplication): void {
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  app.use(httpLoggingMiddleware);
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
  configureSwagger(app);
}
