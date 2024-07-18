import { Express } from "express";
import catalog from "./catalog";
import user from "./user";
import product from "./product";
import coupon from "./coupon";
import order from "./order";
import detail from "./detail";
import { refreshToken, verifyAccount } from "../auth/AuthController";
import ErrorHandler from "../middleware/handleError";

export function routes(app: Express) {
  app.use("/api/refresh", refreshToken);
  app.use("/api/users", verifyAccount, user);
  app.use("/api/products", verifyAccount, product);
  app.use("/api/catalogs", verifyAccount, catalog);
  app.use("/api/coupons", verifyAccount, coupon);
  app.use("/api/orders", verifyAccount, order);
  app.use("/api/details", verifyAccount, detail);
  app.use(ErrorHandler);
}
