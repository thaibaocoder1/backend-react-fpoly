import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Detail } from "../model/Detail";

class DetailController {
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await Detail.find({ orderID: req.params.id })
        .populate("productID")
        .exec();
      res.status(StatusCodes.OK).json({
        success: true,
        message: "GET",
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  };
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await Detail.find()
        .populate("productID")
        .populate("orderID");
      res.status(StatusCodes.OK).json({
        success: true,
        results: orders.length,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  };
  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = req.body;
      const addPromises = list.map(async (update) => {
        const orderDetail = await Detail.create(update);
        if (!orderDetail) throw new Error(`Order detail not found`);
        return orderDetail;
      });
      const addOrderDetail = await Promise.allSettled(addPromises);
      const errors = addOrderDetail
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason.message);

      if (errors.length > 0) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: `Some updates failed: ${errors.join(", ")}`,
          data: null,
        });
      } else {
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Success",
          data: addOrderDetail,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  statistical = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const details = await Detail.find().populate({
        path: "orderID",
        match: { status: 4 },
      });
      console.log(details);
      const orders = details.filter((detail) => detail.orderID !== null);
      if (orders) {
        return res.status(StatusCodes.OK).json({
          success: true,
          message: "READ",
          data: orders,
        });
      } else {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Không có đơn hàng nào được tìm thấy.",
          data: null,
        });
      }
    } catch (error) {
      next(error);
    }
  };
}

export const detailController = new DetailController();
