import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConflictException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import {
  AuthRepository,
  type CurrentUser,
  DuplicateRegistrationError,
  type AuthUser,
  type RegisteredUser,
} from "./auth.repository";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let authService: AuthService;
  let authRepository: {
    findByUsername: jest.MockedFunction<(username: string) => Promise<AuthUser | null>>;
    findCurrentById: jest.MockedFunction<(id: number) => Promise<CurrentUser | null>>;
    create: jest.MockedFunction<
      (email: string, username: string, passwordHash: string) => Promise<RegisteredUser>
    >;
  };
  let jwtService: {
    signAsync: jest.MockedFunction<(payload: { sub: number; username: string }) => Promise<string>>;
  };
  let logSpy: jest.SpiedFunction<Logger["log"]>;
  let warnSpy: jest.SpiedFunction<Logger["warn"]>;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    authRepository = {
      findByUsername: jest.fn(),
      findCurrentById: jest.fn(),
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

  afterEach(() => {
    jest.restoreAllMocks();
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

    expect(authRepository.create).toHaveBeenCalledWith(
      "user@example.com",
      "new-user",
      expect.any(String),
    );
    const storedPassword = authRepository.create.mock.calls[0][2];

    expect(storedPassword).not.toBe("Password123");
    await expect(compare("Password123", storedPassword)).resolves.toBe(true);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith("[AUTH] registration success userId=5 username=new-user");
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
    expect(jwtService.signAsync).not.toHaveBeenCalled();
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
    expect(logSpy).toHaveBeenCalledWith("[AUTH] login success userId=1 username=roberto");
  });

  it("returns the safe current authenticated user projection", async () => {
    authRepository.findCurrentById.mockResolvedValue({
      id: 1,
      email: "roberto@example.com",
      username: "roberto",
    });

    await expect(authService.getCurrentUser(1)).resolves.toEqual({
      id: 1,
      email: "roberto@example.com",
      username: "roberto",
    });
    expect(authRepository.findCurrentById).toHaveBeenCalledWith(1);
  });

  it("returns unauthorized when the current authenticated user no longer exists", async () => {
    authRepository.findCurrentById.mockResolvedValue(null);

    await expect(authService.getCurrentUser(1)).rejects.toMatchObject({
      status: 401,
      message: "Authentication is required.",
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
    expect(warnSpy).toHaveBeenCalledWith("[AUTH] login failed username=unknown");
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
    expect(warnSpy).toHaveBeenCalledWith("[AUTH] login failed username=roberto");
  });
});
