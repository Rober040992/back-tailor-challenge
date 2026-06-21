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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
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
@ApiTags("favourites")
@ApiCookieAuth("access_token")
@ApiUnauthorizedResponse({ description: "Authentication is required." })
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Get("me/favourites")
  @ApiOperation({ summary: "List the authenticated user's favourite restaurants" })
  @ApiOkResponse({ description: "Favourites returned successfully.", type: FavouritesResponse })
  findMine(@Req() request: AuthenticatedRequest): Promise<FavouritesResponse> {
    return this.favouritesService.findMine(request.user.id);
  }

  @Post("me/favourites/:restaurantId")
  @ApiOperation({ summary: "Add a restaurant to favourites" })
  @ApiParam({ name: "restaurantId", type: Number, example: 1 })
  @ApiCreatedResponse({ description: "Favourite created successfully.", type: FavouriteResponse })
  @ApiBadRequestResponse({ description: "The restaurant ID is invalid." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  @ApiConflictResponse({ description: "The restaurant is already a favourite." })
  create(
    @Req() request: AuthenticatedRequest,
    @Param() params: RestaurantIdParamDto,
  ): Promise<FavouriteResponse> {
    return this.favouritesService.create(request.user.id, params.restaurantId);
  }

  @Delete("me/favourites/:restaurantId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a restaurant from favourites" })
  @ApiParam({ name: "restaurantId", type: Number, example: 1 })
  @ApiNoContentResponse({ description: "Favourite removed successfully." })
  @ApiBadRequestResponse({ description: "The restaurant ID is invalid." })
  @ApiNotFoundResponse({ description: "The favourite does not exist." })
  delete(
    @Req() request: AuthenticatedRequest,
    @Param() params: RestaurantIdParamDto,
  ): Promise<void> {
    return this.favouritesService.delete(request.user.id, params.restaurantId);
  }
}
