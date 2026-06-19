import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthRepository, PublicUser } from "./auth.repository";

interface JwtPayload {
  sub: number;
  username: string;
}

function extractAccessToken(request: Request): string | null {
  const cookies = request.cookies as Record<string, unknown> | undefined;
  const accessToken = cookies?.access_token;

  return typeof accessToken === "string" ? accessToken : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authRepository: AuthRepository,
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET");

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is required.");
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractAccessToken]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<PublicUser> {
    if (!Number.isInteger(payload.sub) || typeof payload.username !== "string") {
      throw new UnauthorizedException();
    }

    const user = await this.authRepository.findPublicById(payload.sub);

    if (!user || user.username !== payload.username) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
