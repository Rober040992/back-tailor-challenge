import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { PublicUser } from "../auth/auth.repository";
import { logSafely } from "../common/logging/safe-logger";
import { CommentResponse, CommentsResponse } from "./comment-response";
import { CommentRestaurantNotFoundError, CommentsRepository } from "./comments.repository";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

const RESTAURANT_NOT_FOUND_MESSAGE = "Restaurant not found.";
const COMMENT_NOT_FOUND_MESSAGE = "Comment not found.";
const COMMENT_FORBIDDEN_MESSAGE = "You can only modify your own comments.";
const EMPTY_UPDATE_MESSAGE = "At least one editable field is required.";

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly commentsRepository: CommentsRepository) {}

  async findByRestaurant(restaurantId: number): Promise<CommentsResponse> {
    if (!(await this.commentsRepository.restaurantExists(restaurantId))) {
      throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
    }

    return {
      results: await this.commentsRepository.findByRestaurantId(restaurantId),
    };
  }

  async create(
    user: PublicUser,
    restaurantId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponse> {
    if (!(await this.commentsRepository.restaurantExists(restaurantId))) {
      throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
    }

    try {
      const comment = await this.commentsRepository.create({
        ...createCommentDto,
        restaurantId,
        userId: user.id,
        name: user.username,
        date: new Date().toISOString().slice(0, 10),
      });

      logSafely(
        this.logger,
        "log",
        `[COMMENT] created commentId=${comment.id} restaurantId=${restaurantId} userId=${user.id}`,
      );

      return comment;
    } catch (error) {
      if (error instanceof CommentRestaurantNotFoundError) {
        throw new NotFoundException(RESTAURANT_NOT_FOUND_MESSAGE);
      }

      throw error;
    }
  }

  async update(
    userId: number,
    commentId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponse> {
    if (updateCommentDto.rating === undefined && updateCommentDto.body === undefined) {
      throw new BadRequestException(EMPTY_UPDATE_MESSAGE);
    }

    const comment = await this.findExisting(commentId);
    this.assertOwnership(comment.userId, userId);

    const updatedComment = await this.commentsRepository.update(commentId, updateCommentDto);

    logSafely(this.logger, "log", `[COMMENT] updated commentId=${commentId} userId=${userId}`);

    return updatedComment;
  }

  async delete(userId: number, commentId: number): Promise<void> {
    const comment = await this.findExisting(commentId);
    this.assertOwnership(comment.userId, userId);

    if (!(await this.commentsRepository.delete(commentId))) {
      throw new NotFoundException(COMMENT_NOT_FOUND_MESSAGE);
    }

    logSafely(this.logger, "log", `[COMMENT] deleted commentId=${commentId} userId=${userId}`);
  }

  private async findExisting(commentId: number): Promise<CommentResponse> {
    const comment = await this.commentsRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundException(COMMENT_NOT_FOUND_MESSAGE);
    }

    return comment;
  }

  private assertOwnership(commentUserId: number, authenticatedUserId: number): void {
    if (commentUserId !== authenticatedUserId) {
      throw new ForbiddenException(COMMENT_FORBIDDEN_MESSAGE);
    }
  }
}
