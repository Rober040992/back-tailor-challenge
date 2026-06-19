import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AuthUser = Pick<User, "id" | "username" | "passwordHash">;
export type PublicUser = Pick<User, "id" | "username">;

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
}
