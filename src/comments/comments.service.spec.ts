import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { BadRequestException, ForbiddenException, Logger, NotFoundException } from "@nestjs/common";
import { Comment } from "@prisma/client";
import {
  CommentNotFoundError,
  CommentRestaurantNotFoundError,
  CommentsRepository,
} from "./comments.repository";
import { CommentsService } from "./comments.service";

function createComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    userId: 1,
    restaurantId: 1,
    name: "roberto",
    date: "2026-06-21",
    rating: 4,
    body: "Great food.",
    createdAt: new Date("2026-06-21T10:00:00.000Z"),
    updatedAt: new Date("2026-06-21T10:00:00.000Z"),
    ...overrides,
  };
}

describe("CommentsService", () => {
  let commentsService: CommentsService;
  let commentsRepository: {
    restaurantExists: jest.MockedFunction<CommentsRepository["restaurantExists"]>;
    findByRestaurantId: jest.MockedFunction<CommentsRepository["findByRestaurantId"]>;
    findById: jest.MockedFunction<CommentsRepository["findById"]>;
    create: jest.MockedFunction<CommentsRepository["create"]>;
    update: jest.MockedFunction<CommentsRepository["update"]>;
    delete: jest.MockedFunction<CommentsRepository["delete"]>;
  };
  let logSpy: jest.SpiedFunction<Logger["log"]>;

  beforeEach(() => {
    logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    commentsRepository = {
      restaurantExists: jest.fn(),
      findByRestaurantId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    commentsService = new CommentsService(commentsRepository as unknown as CommentsRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists comments for an existing restaurant", async () => {
    const comment = createComment();
    commentsRepository.restaurantExists.mockResolvedValue(true);
    commentsRepository.findByRestaurantId.mockResolvedValue([comment]);

    await expect(commentsService.findByRestaurant(1)).resolves.toEqual({
      results: [comment],
    });
  });

  it("returns not found when listing a missing restaurant", async () => {
    commentsRepository.restaurantExists.mockResolvedValue(false);

    await expect(commentsService.findByRestaurant(999)).rejects.toBeInstanceOf(NotFoundException);
    expect(commentsRepository.findByRestaurantId).not.toHaveBeenCalled();
  });

  it("creates a comment with server-generated author data", async () => {
    const comment = createComment();
    commentsRepository.restaurantExists.mockResolvedValue(true);
    commentsRepository.create.mockResolvedValue(comment);

    await expect(
      commentsService.create({ id: 1, username: "roberto" }, 1, { rating: 4, body: "Great food." }),
    ).resolves.toEqual(comment);
    expect(commentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        restaurantId: 1,
        name: "roberto",
        rating: 4,
        body: "Great food.",
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );
    expect(logSpy).toHaveBeenCalledWith("[COMMENT] created commentId=1 restaurantId=1 userId=1");
  });

  it("returns not found when the restaurant disappears during creation", async () => {
    commentsRepository.restaurantExists.mockResolvedValue(true);
    commentsRepository.create.mockRejectedValue(new CommentRestaurantNotFoundError());

    await expect(
      commentsService.create({ id: 1, username: "roberto" }, 1, { rating: 4, body: "Great food." }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects an update without editable fields", async () => {
    await expect(commentsService.update(1, 1, {})).rejects.toBeInstanceOf(BadRequestException);
    expect(commentsRepository.findById).not.toHaveBeenCalled();
  });

  it("allows the author to update a comment", async () => {
    const updatedComment = createComment({ rating: 5 });
    commentsRepository.findById.mockResolvedValue(createComment());
    commentsRepository.update.mockResolvedValue(updatedComment);

    await expect(commentsService.update(1, 1, { rating: 5 })).resolves.toEqual(updatedComment);
    expect(commentsRepository.update).toHaveBeenCalledWith(1, { rating: 5 });
    expect(logSpy).toHaveBeenCalledWith("[COMMENT] updated commentId=1 userId=1");
  });

  it("rejects an update by another authenticated user", async () => {
    commentsRepository.findById.mockResolvedValue(createComment({ userId: 2 }));

    await expect(commentsService.update(1, 1, { rating: 5 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(commentsRepository.update).not.toHaveBeenCalled();
  });

  it("returns not found when updating a missing comment", async () => {
    commentsRepository.findById.mockResolvedValue(null);

    await expect(commentsService.update(1, 999, { rating: 5 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("returns not found when the comment disappears during update", async () => {
    commentsRepository.findById.mockResolvedValue(createComment());
    commentsRepository.update.mockRejectedValue(new CommentNotFoundError());

    await expect(commentsService.update(1, 1, { rating: 5 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("allows the author to delete a comment", async () => {
    commentsRepository.findById.mockResolvedValue(createComment());
    commentsRepository.delete.mockResolvedValue(true);

    await expect(commentsService.delete(1, 1)).resolves.toBeUndefined();
    expect(logSpy).toHaveBeenCalledWith("[COMMENT] deleted commentId=1 userId=1");
  });

  it("rejects deletion by another authenticated user", async () => {
    commentsRepository.findById.mockResolvedValue(createComment({ userId: 2 }));

    await expect(commentsService.delete(1, 1)).rejects.toBeInstanceOf(ForbiddenException);
    expect(commentsRepository.delete).not.toHaveBeenCalled();
  });

  it("returns not found when deleting a missing comment", async () => {
    commentsRepository.findById.mockResolvedValue(null);

    await expect(commentsService.delete(1, 999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
