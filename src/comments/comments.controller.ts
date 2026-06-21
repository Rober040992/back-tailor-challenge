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
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get("restaurants/:restaurantId/comments")
  findByRestaurant(@Param() params: RestaurantIdParamDto): Promise<CommentsResponse> {
    return this.commentsService.findByRestaurant(params.restaurantId);
  }

  @Post("restaurants/:restaurantId/comments")
  @UseGuards(JwtAuthGuard)
  create(
    @Req() request: AuthenticatedRequest,
    @Param() params: RestaurantIdParamDto,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponse> {
    return this.commentsService.create(request.user, params.restaurantId, createCommentDto);
  }

  @Patch("comments/:commentId")
  @UseGuards(JwtAuthGuard)
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
  delete(@Req() request: AuthenticatedRequest, @Param() params: CommentIdParamDto): Promise<void> {
    return this.commentsService.delete(request.user.id, params.commentId);
  }
}
