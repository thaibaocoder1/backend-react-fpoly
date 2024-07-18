import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { promisify } from "util";
import { User } from "../app/model/User";
import StatusCodes from "http-status-codes";

const sign = promisify(jwt.sign).bind(jwt);
const verify = promisify(jwt.verify).bind(jwt);

export const generateToken = async (
  payload: any,
  secretSignature: string,
  tokenLife: string | number
) => {
  try {
    return await sign(
      {
        payload,
      },
      secretSignature,
      {
        algorithm: "HS256",
        expiresIn: tokenLife,
      }
    );
  } catch (error) {
    console.log(`Error in generate access token: ${error}`);
    return null;
  }
};

export const decodeToken = async (token: string, secretKey: string) => {
  try {
    return await verify(token, secretKey);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      if (error.name === "TokenExpiredError") {
        console.log("Token expired");
      } else {
        console.log(`Error in decode token: ${error.message}`);
      }
    }
  }
};

export const verifyAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken: string = req.headers["authorization"]?.split(
    " "
  )[1] as string;
  let rToken: string | null;
  const { refreshToken, refreshTokenAdmin } = req.cookies;
  if (!refreshToken && !refreshTokenAdmin) {
    rToken = null;
  } else {
    if (refreshToken && !refreshTokenAdmin) {
      rToken = refreshToken;
    } else if (!refreshToken && refreshTokenAdmin) {
      rToken = refreshTokenAdmin;
    } else {
      rToken = null;
    }
  }
  if (!accessToken || !rToken) {
    next();
  } else {
    const accessTokenSecret: string = <string>process.env.ACCESS_TOKEN_SECRET;
    const verifyToken = await decodeToken(accessToken, accessTokenSecret);
    if (verifyToken) {
      const { payload } = verifyToken;
      const user = await User.findOneDeleted({ email: payload.email });
      if (user && user.deleted) {
        if (user.role.toLowerCase() === "user") {
          res.clearCookie("refreshToken");
        } else {
          res.clearCookie("refreshTokenAdmin");
        }
      }
      next();
    } else {
      res.status(401).json({
        success: false,
        message: "Unauthorization",
      });
    }
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken, refreshTokenAdmin } = req.cookies;
    let token: string = "";
    if (!refreshToken && !refreshTokenAdmin) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "UNAUTHORIZED",
      });
    } else {
      if (refreshToken) token = refreshToken;
      if (refreshTokenAdmin) token = refreshTokenAdmin;
    }
    const accessTokenLife: string = <string>process.env.ACCESS_TOKEN_LIFE;
    const refreshTokenLife: string = <string>process.env.REFRESH_TOKEN_LIFE;
    const accessTokenSecret: string = <string>process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret: string = <string>process.env.REFRESH_TOKEN_SECRET;
    const verifyToken = await decodeToken(token, refreshTokenSecret);
    if (verifyToken) {
      const newAccessToken = await generateToken(
        verifyToken.payload,
        accessTokenSecret,
        accessTokenLife
      );
      const newRefreshToken = await generateToken(
        verifyToken.payload,
        refreshTokenSecret,
        refreshTokenLife
      );
      const user = await User.findOneAndUpdateWithDeleted(
        {
          email: verifyToken.payload.email,
        },
        {
          refreshToken: newRefreshToken,
        },
        { runValidators: true, new: true }
      );
      if (user?.role === "User") {
        res.cookie("refreshToken", newRefreshToken, {
          secure: false,
          httpOnly: true,
          path: "/",
          expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE)),
        });
      }
      if (refreshTokenAdmin) {
        res.cookie("refreshTokenAdmin", newRefreshToken, {
          secure: false,
          httpOnly: true,
          path: "/",
          expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE)),
        });
      }
      res.status(StatusCodes.OK).json({
        accessToken: newAccessToken,
      });
    }
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error from SERVER!",
      data: null,
    });
  }
  next();
};
