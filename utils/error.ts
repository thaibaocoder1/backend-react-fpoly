import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: "failed",
    error: err.message || "Internal Server Error",
  });
};

export default errorHandler;
