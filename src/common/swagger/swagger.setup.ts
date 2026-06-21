import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

const SWAGGER_COOKIE_AUTH_NAME = "access_token";

export function configureSwagger(app: INestApplication): void {
  if (!isSwaggerEnabled()) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle("Restaurant Reservation API")
    .setDescription("REST API documentation for the restaurant reservation backend.")
    .setVersion("1.0")
    .addCookieAuth(
      SWAGGER_COOKIE_AUTH_NAME,
      {
        type: "apiKey",
        in: "cookie",
        name: SWAGGER_COOKIE_AUTH_NAME,
        description: "JWT stored in the HttpOnly authentication cookie.",
      },
      SWAGGER_COOKIE_AUTH_NAME,
    )
    .addTag("auth")
    .addTag("restaurants")
    .addTag("availability")
    .addTag("reservations")
    .addTag("favourites")
    .addTag("comments")
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      autoTagControllers: false,
      operationIdFactory: (_controllerKey, methodKey) => methodKey,
    });

  SwaggerModule.setup("docs", app, documentFactory, {
    jsonDocumentUrl: "docs-json",
    raw: ["json"],
    customSiteTitle: "Restaurant Reservation API",
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

export function isSwaggerEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.NODE_ENV !== "production" || environment.SWAGGER_ENABLED === "true";
}
