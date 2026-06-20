import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { JwtService } from "@nestjs/jwt";
import { hash } from "bcrypt";
import { AuthRepository, type AuthUser } from "./auth.repository";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let authRepository: {
    findByUsername: jest.MockedFunction<(username: string) => Promise<AuthUser | null>>;
  };
  let jwtService: {
    signAsync: jest.MockedFunction<(payload: { sub: number; username: string }) => Promise<string>>;
  };

  beforeEach(() => {
    authRepository = {
      findByUsername: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    authService = new AuthService(authRepository as unknown as AuthRepository, jwtService as unknown as JwtService);
  });

  it("returns a public user and signs the expected JWT payload", async () => {
    authRepository.findByUsername.mockResolvedValue({
      id: 1,
      username: "roberto",
      passwordHash: await hash("12345", 4),
    });
    jwtService.signAsync.mockResolvedValue("signed-token");

    await expect(
      authService.login({
        username: "roberto",
        password: "12345",
      }),
    ).resolves.toEqual({
      accessToken: "signed-token",
      user: {
        id: 1,
        username: "roberto",
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      username: "roberto",
    });
  });

  it("returns the same unauthorized error for an unknown username", async () => {
    authRepository.findByUsername.mockResolvedValue(null);

    await expect(
      authService.login({
        username: "unknown",
        password: "12345",
      }),
    ).rejects.toMatchObject({
      status: 401,
      message: "Invalid username or password.",
    });
  });

  it("returns the same unauthorized error for an invalid password", async () => {
    authRepository.findByUsername.mockResolvedValue({
      id: 1,
      username: "roberto",
      passwordHash: await hash("12345", 4),
    });

    await expect(
      authService.login({
        username: "roberto",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      status: 401,
      message: "Invalid username or password.",
    });
  });
});
