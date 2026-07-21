import type { ErrorRequestHandler, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, _res, next) => next(new AppError(404, "NOT_FOUND", "Route not found"));

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request contains invalid values.",
        fieldErrors: error.flatten().fieldErrors
      }
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ error: { code: "CONFLICT", message: "A record with that value already exists." } });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  console.error(error);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
};
