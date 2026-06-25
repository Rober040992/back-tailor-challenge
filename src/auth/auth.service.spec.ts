import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import {
  AuthRepository,
  type AuthUser,
  DuplicateRegistrationError,
  type RegisteredUser,
} from "./auth.repository";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let authRepository: {
    findByUsername: jest.MockedFunction<(username: string) => Promise<AuthUser | null>>;
    create: jest.MockedFunction<
      (email: string, username: string, passwordHash: string) => Promise<RegisteredUser>
    >;
  };
  let jwtService: {
    signAsync: jest.MockedFunction<(payload: { sub: number; username: string }) => Promise<string>>;
  };

  beforeEach(() => {
    authRepository = {
      findByUsername: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    authService = new AuthService(
      authRepository as unknown as AuthRepository,
      jwtService as unknown as JwtService,
    );
  });

  it("registers a user with a hashed password and without signing a JWT", async () => {
    const createdAt = new Date("2026-06-22T10:00:00.000Z");
    const updatedAt = new Date("2026-06-22T10:00:00.000Z");
    authRepository.create.mockResolvedValue({
      id: 5,
      email: "user@example.com",
      username: "new-user",
      createdAt,
      updatedAt,
    });

    await expect(
      authService.register({
        email: "user@example.com",
        username: "new-user",
        password: "Password123",
      }),
    ).resolves.toEqual({
      id: 5,
      email: "user@example.com",
      username: "new-user",
      createdAt,
      updatedAt,
    });

    const storedPassword = authRepository.create.mock.calls[0][2];

    expect(storedPassword).not.toBe("Password123");
    await expect(compare("Password123", storedPassword)).resolves.toBe(true);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it("returns conflict when the email or username already exists", async () => {
    authRepository.create.mockRejectedValue(new DuplicateRegistrationError());

    await expect(
      authService.register({
        email: "user@example.com",
        username: "new-user",
        password: "Password123",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
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

  it("returns the same unauthorized error for unknown username and invalid password", async () => {
    authRepository.findByUsername.mockResolvedValueOnce(null);

    const unknownUser = authService.login({
      username: "unknown",
      password: "12345",
    });

    await expect(unknownUser).rejects.toMatchObject({
      status: 401,
      message: "Invalid username or password.",
    });

    authRepository.findByUsername.mockResolvedValueOnce({
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
