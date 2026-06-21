import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import type { PublicUser } from "../auth/auth.repository";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { RestaurantIdParamDto } from "./dto/restaurant-id-param.dto";
import { FavouriteResponse, FavouritesResponse, FavouritesService } from "./favourites.service";

interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Get("me/favourites")
  findMine(@Req() request: AuthenticatedRequest): Promise<FavouritesResponse> {
    return this.favouritesService.findMine(request.user.id);
  }

  @Post("me/favourites/:restaurantId")
  create(
    @Req() request: AuthenticatedRequest,
    @Param() params: RestaurantIdParamDto,
  ): Promise<FavouriteResponse> {
    return this.favouritesService.create(request.user.id, params.restaurantId);
  }

  @Delete("me/favourites/:restaurantId")
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Req() request: AuthenticatedRequest,
    @Param() params: RestaurantIdParamDto,
  ): Promise<void> {
    return this.favouritesService.delete(request.user.id, params.restaurantId);
  }
}
