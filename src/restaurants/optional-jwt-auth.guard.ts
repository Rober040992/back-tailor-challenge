import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import type { PublicUser } from "../auth/auth.repository";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser = PublicUser | null>(error: unknown, user: PublicUser | false | null): TUser {
    if (error || !user) {
      return null as TUser;
    }

    return user as TUser;
  }
}
