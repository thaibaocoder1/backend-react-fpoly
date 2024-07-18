import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import util from "util";
import mailer from "../../middleware/mailer";
import { checkCoupons } from "../../utils/check";
import { Detail } from "../model/Detail";
import { Order } from "../model/Order";
import Stripe from "stripe";

// Stripe
const stripe = new Stripe(
  "sk_test_51PdnC0BJ5MAfNCnP1dgbWMyQkG191M6JvbxBstWzkUhEFUzvoJHygYr1oST0m4RibMISMBNfbpChOCWzUOSjJWKd00bBuw0kFl"
);

const readFile = util.promisify(fs.readFile);
async function waitForFile(filePath: string): Promise<void> {
  return new Promise((resolve) => {
    const checkExistence = async () => {
      try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        resolve();
      } catch (error) {
        setTimeout(checkExistence, 1000);
      }
    };
    checkExistence();
  });
}

class OrderController {
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _page, _limit, _search, _status } = req.query;
      const skip = ((Number(_page) || 1) - 1) * Number(_limit);
      const filters = {
        status: !!_status ? Number(_status) : { $exists: true },
        ...(_search &&
          _search !== "" && {
            $or: [
              { email: { $regex: _search, $options: "i" } },
              { fullname: { $regex: _search, $options: "i" } },
              { address: { $regex: _search, $options: "i" } },
            ].filter(Boolean),
          }),
      };
      const query = Order.find(filters).skip(skip).limit(Number(_limit));
      const orders = await query;
      const totalOrders = await Order.countDocuments(filters);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Read success",
        data: orders,
        pagination: {
          page: Number(_page),
          limit: Number(_limit),
          totalPages: Math.ceil(totalOrders / Number(_limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  };
  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await Order.findOne({ _id: req.params.id }).populate(
        "userId"
      );
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Get successfully",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };
  order = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _page, _limit, _status } = req.query;
      const skip = ((Number(_page) || 1) - 1) * Number(_limit);
      const filters = {
        userId: req.params.id,
        status: !!_status ? Number(_status) : { $exists: true },
      };
      const query = Order.find(filters).skip(skip).limit(Number(_limit));
      const order = await query;
      const countOrders = await Order.countDocuments(filters);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Get successfully",
        data: order,
        pagination: {
          page: Number(_page),
          limit: Number(_limit),
          totalPages: Math.ceil(countOrders / Number(_limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  };
  updateFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, status } = req.body;
      const order = await Order.findById({ _id: id });
      let cancelCount = 0;
      if (order) {
        cancelCount = order.cancelCount as number;
        if (status === 5) {
          cancelCount++;
          await Order.updateOne(
            { _id: req.params.id },
            { status, cancelCount },
            { new: true, runValidators: true }
          );
        } else {
          await Order.updateOne(
            { _id: req.params.id },
            { status },
            { new: true, runValidators: true }
          );
        }
        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Update successfully!",
          data: order,
        });
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Update failed!",
          data: null,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const values = { ...req.body };
      const { coupons } = values;
      values.address = `${values.province}, ${values.district}, ${values.ward}, ${values.address}`;
      delete values.province;
      delete values.district;
      delete values.ward;
      const checkCouponExistence = await checkCoupons(coupons);
      if (checkCouponExistence) {
        res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: checkCouponExistence,
          data: null,
        });
      } else {
        delete values.coupons;
        const order = await Order.create(values);
        if (order) {
          res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Add order success!!",
            data: order,
          });
        } else {
          res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Add order failed!!",
            data: null,
          });
        }
      }
    } catch (error) {
      next(error);
    }
  };
  session = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cart } = req.body;
      const lineItems = cart.map((item: any) => ({
        price_data: {
          currency: "VND",
          product_data: {
            name: item.name,
            images: [item.thumb[0].fileName],
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      }));
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        success_url: "http://localhost:5173/order/complete",
        line_items: lineItems,
        mode: "payment",
      });
      res.json({ id: session.id });
    } catch (error) {
      next(error);
    }
  };
  invoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const order = await Order.findById({ _id: id });
      const orderDetail = await Detail.find({ orderID: id }).populate(
        "productID"
      );
      if (order) {
        const filePath = await mailer.renderInvoice(order, orderDetail);
        await waitForFile(filePath);
        const pdfContent = await readFile(filePath);
        (await mailer.createTransporter()).sendMail({
          from: "bSmart ADMIN",
          to: order.email,
          subject: "Đơn hành thanh toán tại bSmart ✔",
          text: "Đơn hành thanh toán tại bSmart",
          attachments: [
            {
              filename: "invoice.pdf",
              content: pdfContent,
            },
          ],
        });
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Send bill successfully!",
          data: order,
        });
      } else {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Không có đơn hàng nào được tìm thấy.",
        });
      }
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Đã xảy ra lỗi khi lấy thông tin đơn hàng.",
      });
    }
  };
}

export const orderController = new OrderController();
