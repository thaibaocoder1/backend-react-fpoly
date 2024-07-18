import { Request, Response, NextFunction } from "express";
import { Coupon } from "../model/Coupon";
import { StatusCodes } from "http-status-codes";

class CouponController {
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _page, _limit, _search } = req.query;
      const skip = ((Number(_page) || 1) - 1) * Number(_limit);
      const filters = {
        ...(_search &&
          _search !== "" && {
            $or: [{ name: { $regex: _search, $options: "i" } }].filter(Boolean),
          }),
      };
      const query = Coupon.find(filters).skip(skip).limit(Number(_limit));
      const coupons = await query;
      const countDocuments = await Coupon.countDocuments(filters);
      if (coupons) {
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Read Sucessfully!",
          data: coupons,
          pagination: {
            page: Number(_page),
            limit: Number(_limit),
            totalPages: Math.ceil(countDocuments / Number(_limit)),
          },
        });
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: true,
          message: "Read Error!",
          data: null,
          pagination: {},
        });
      }
    } catch (error) {
      next(error);
    }
  };
  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const counpon = await Coupon.findById({ _id: req.params.id });
      if (counpon) {
        res.status(StatusCodes.OK).json({
          status: "success",
          message: "Get succesfully",
          data: counpon,
        });
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          status: "failed",
          message: "Not found apply coupon!!",
          data: null,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  check = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body;
      const coupon = await Coupon.findOne({ name });
      if (coupon) {
        const now: number = Math.floor(Date.now());
        const couponExpire: number = Math.floor(coupon.expireIns);
        if (now > couponExpire) {
          res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Coupon is expire!!",
            data: null,
          });
        } else {
          res.status(StatusCodes.OK).json({
            success: true,
            message: "Coupon is valid!!",
            data: coupon,
          });
        }
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Coupon is invalid!!",
          data: null,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const values = { ...req.body };
      const counpon = await Coupon.findOneAndUpdate(
        { _id: req.params.id },
        values,
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Update",
        data: counpon,
      });
    } catch (error) {
      next(error);
    }
  };
  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const values = { ...req.body };
      const couponExist = await Coupon.findOne({ name: values.name });
      if (couponExist) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Duplicate coupon",
          data: null,
        });
      } else {
        const coupon = await Coupon.create(values);
        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Add succesfully",
          data: coupon,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (id) {
        await Coupon.deleteOne({ _id: id });
        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Delete success!",
        });
      } else {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Delete failed!",
        });
      }
    } catch (error) {
      next(error);
    }
  };
}

export const couponController = new CouponController();
