import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

process.loadEnvFile();

const SEED_PASSWORD = "12345";
const BCRYPT_SALT_ROUNDS = 10;
const RESTAURANTS_FILE = resolve(process.cwd(), "prisma/seed-data/restaurants.json");
const SEED_USERS = [
  { email: "roberto@example.com", username: "roberto" },
  { email: "lautaro@example.com", username: "lautaro" },
  { email: "nico@example.com", username: "nico" },
  { email: "aida@example.com", username: "aida" },
] as const;

interface SourceComment {
  name: string;
  date: string;
  rating: number;
  body: string;
}

interface SourceRestaurant {
  name: string;
  neighborhood: string;
  photograph: string;
  address: string;
  latlng: {
    lat: number;
    lng: number;
  };
  image: string;
  cuisine_type: string;
  description: string;
  capacity: number;
  reservationSettings: Prisma.InputJsonValue;
  operating_hours: Prisma.InputJsonValue;
  comments: SourceComment[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(record: Record<string, unknown>, field: string, context: string): string {
  const value = record[field];

  if (typeof value !== "string") {
    throw new Error(`${context}.${field} must be a string.`);
  }

  return value;
}

function requireNumber(record: Record<string, unknown>, field: string, context: string): number {
  const value = record[field];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${context}.${field} must be a finite number.`);
  }

  return value;
}

function requireJson(
  record: Record<string, unknown>,
  field: string,
  context: string,
): Prisma.InputJsonValue {
  const value = record[field];

  if (!isRecord(value) && !Array.isArray(value)) {
    throw new Error(`${context}.${field} must be a JSON object or array.`);
  }

  return value as Prisma.InputJsonValue;
}

function parseComment(value: unknown, context: string): SourceComment {
  if (!isRecord(value)) {
    throw new Error(`${context} must be an object.`);
  }

  return {
    name: requireString(value, "name", context),
    date: requireString(value, "date", context),
    rating: requireNumber(value, "rating", context),
    body: requireString(value, "body", context),
  };
}

function parseRestaurant(value: unknown, index: number): SourceRestaurant {
  const context = `restaurants[${index}]`;

  if (!isRecord(value)) {
    throw new Error(`${context} must be an object.`);
  }

  if (!isRecord(value.latlng)) {
    throw new Error(`${context}.latlng must be an object.`);
  }

  if (!Array.isArray(value.comments)) {
    throw new Error(`${context}.comments must be an array.`);
  }

  const capacity = requireNumber(value, "capacity", context);

  if (!Number.isInteger(capacity)) {
    throw new Error(`${context}.capacity must be an integer.`);
  }

  return {
    name: requireString(value, "name", context),
    neighborhood: requireString(value, "neighborhood", context),
    photograph: requireString(value, "photograph", context),
    address: requireString(value, "address", context),
    latlng: {
      lat: requireNumber(value.latlng, "lat", `${context}.latlng`),
      lng: requireNumber(value.latlng, "lng", `${context}.latlng`),
    },
    image: requireString(value, "image", context),
    cuisine_type: requireString(value, "cuisine_type", context),
    description: requireString(value, "description", context),
    capacity,
    reservationSettings: requireJson(value, "reservationSettings", context),
    operating_hours: requireJson(value, "operating_hours", context),
    comments: value.comments.map((comment, commentIndex) =>
      parseComment(comment, `${context}.comments[${commentIndex}]`),
    ),
  };
}

async function loadRestaurants(): Promise<SourceRestaurant[]> {
  const source = await readFile(RESTAURANTS_FILE, "utf8");
  const parsed: unknown = JSON.parse(source);

  if (!Array.isArray(parsed)) {
    throw new Error("Restaurant seed data must be an array.");
  }

  return parsed.map(parseRestaurant);
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const restaurants = await loadRestaurants();
  const passwordHashes = await Promise.all(
    SEED_USERS.map(() => hash(SEED_PASSWORD, BCRYPT_SALT_ROUNDS)),
  );
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    await prisma.$transaction(async transaction => {
      await transaction.favourite.deleteMany();
      await transaction.comment.deleteMany();
      await transaction.reservation.deleteMany();
      await transaction.restaurant.deleteMany();
      await transaction.user.deleteMany();

      await transaction.$executeRaw`ALTER SEQUENCE "Favourite_id_seq" RESTART WITH 1`;
      await transaction.$executeRaw`ALTER SEQUENCE "Comment_id_seq" RESTART WITH 1`;
      await transaction.$executeRaw`ALTER SEQUENCE "Reservation_id_seq" RESTART WITH 1`;
      await transaction.$executeRaw`ALTER SEQUENCE "Restaurant_id_seq" RESTART WITH 1`;
      await transaction.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;

      const createdUsers = await Promise.all(
        SEED_USERS.map((user, index) =>
          transaction.user.create({
            data: {
              email: user.email,
              username: user.username,
              passwordHash: passwordHashes[index],
            },
          }),
        ),
      );
      const roberto = createdUsers.find(user => user.username === "roberto");

      if (!roberto) {
        throw new Error("Default seed user roberto was not created.");
      }

      for (const restaurant of restaurants) {
        const createdRestaurant = await transaction.restaurant.create({
          data: {
            name: restaurant.name,
            neighborhood: restaurant.neighborhood,
            address: restaurant.address,
            lat: restaurant.latlng.lat,
            lng: restaurant.latlng.lng,
            image: restaurant.image,
            photograph: restaurant.photograph,
            cuisineType: restaurant.cuisine_type,
            description: restaurant.description,
            capacity: restaurant.capacity,
            operatingHours: restaurant.operating_hours,
            reservationSettings: restaurant.reservationSettings,
            ownerId: roberto.id,
          },
        });

        if (restaurant.comments.length > 0) {
          await transaction.comment.createMany({
            data: restaurant.comments.map(comment => ({
              userId: roberto.id,
              restaurantId: createdRestaurant.id,
              name: comment.name,
              date: comment.date,
              rating: comment.rating,
              body: comment.body,
            })),
          });
        }
      }
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? `Database seed failed: ${error.message}` : error);
  process.exitCode = 1;
});
