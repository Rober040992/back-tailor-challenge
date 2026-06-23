import { Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AuthUser = Pick<User, "id" | "username" | "passwordHash">;
export type PublicUser = Pick<User, "id" | "username">;
export type CurrentUser = Pick<User, "id" | "email" | "username">;
export type RegisteredUser = Pick<User, "id" | "email" | "username" | "createdAt" | "updatedAt">;

export class DuplicateRegistrationError extends Error {}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string): Promise<AuthUser | null> {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
      },
    });
  }

  findPublicById(id: number): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
      },
    });
  }

  findCurrentById(id: number): Promise<CurrentUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
  }

  async create(email: string, username: string, passwordHash: string): Promise<RegisteredUser> {
    try {
      return await this.prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new DuplicateRegistrationError();
      }

      throw error;
    }
  }
}
