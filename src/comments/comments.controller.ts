import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
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
import { CommentResponse, CommentsResponse } from "./comment-response";
import { CommentsService } from "./comments.service";
import { CommentIdParamDto } from "./dto/comment-id-param.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { RestaurantIdParamDto } from "./dto/restaurant-id-param.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

@Controller()
@ApiTags("comments")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get("restaurants/:restaurantId/comments")
  @ApiOperation({ summary: "List comments for a restaurant" })
  @ApiParam({ name: "restaurantId", type: Number, example: 1 })
  @ApiOkResponse({ description: "Comments returned successfully.", type: CommentsResponse })
  @ApiBadRequestResponse({ description: "The restaurant ID is invalid." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  findByRestaurant(@Param() params: RestaurantIdParamDto): Promise<CommentsResponse> {
    return this.commentsService.findByRestaurant(params.restaurantId);
  }

  @Post("restaurants/:restaurantId/comments")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth("access_token")
  @ApiOperation({ summary: "Create a comment for a restaurant" })
  @ApiParam({ name: "restaurantId", type: Number, example: 1 })
  @ApiCreatedResponse({ description: "Comment created successfully.", type: CommentResponse })
  @ApiBadRequestResponse({ description: "The path or request body failed validation." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  create(
    @Req() request: AuthenticatedRequest,
    @Param() params: RestaurantIdParamDto,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponse> {
    return this.commentsService.create(request.user, params.restaurantId, createCommentDto);
  }

  @Patch("comments/:commentId")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth("access_token")
  @ApiOperation({ summary: "Update an owned comment" })
  @ApiParam({ name: "commentId", type: Number, example: 1 })
  @ApiOkResponse({ description: "Comment updated successfully.", type: CommentResponse })
  @ApiBadRequestResponse({ description: "The path or request body failed validation." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "The comment belongs to another user." })
  @ApiNotFoundResponse({ description: "The comment does not exist." })
  update(
    @Req() request: AuthenticatedRequest,
    @Param() params: CommentIdParamDto,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    return this.commentsService.update(request.user.id, params.commentId, updateCommentDto);
  }

  @Delete("comments/:commentId")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth("access_token")
  @ApiOperation({ summary: "Delete an owned comment" })
  @ApiParam({ name: "commentId", type: Number, example: 1 })
  @ApiNoContentResponse({ description: "Comment deleted successfully." })
  @ApiBadRequestResponse({ description: "The comment ID is invalid." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiForbiddenResponse({ description: "The comment belongs to another user." })
  @ApiNotFoundResponse({ description: "The comment does not exist." })
  delete(@Req() request: AuthenticatedRequest, @Param() params: CommentIdParamDto): Promise<void> {
    return this.commentsService.delete(request.user.id, params.commentId);
  }
}
