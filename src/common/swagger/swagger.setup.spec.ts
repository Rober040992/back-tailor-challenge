import { isSwaggerEnabled } from "./swagger.setup";

describe("Swagger setup", () => {
  it("enables Swagger outside production", () => {
    expect(isSwaggerEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isSwaggerEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  it("requires an explicit opt-in in production", () => {
    expect(isSwaggerEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isSwaggerEnabled({
        NODE_ENV: "production",
        SWAGGER_ENABLED: "true",
      }),
    ).toBe(true);
  });
});
