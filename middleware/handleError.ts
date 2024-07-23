import { NextFunction, Response, Request } from "express";
import { StatusCodes } from "http-status-codes";

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errStatus = StatusCodes.INTERNAL_SERVER_ERROR;
  const errMsg = err.message || "Something went wrong";
  res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMsg,
  });
};

export default errorHandler;
