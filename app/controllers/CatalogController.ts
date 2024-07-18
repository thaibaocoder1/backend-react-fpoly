import { Request, Response, NextFunction } from "express";
import { Catalog } from "../model/Catalog";
import { StatusCodes } from "http-status-codes";
import { Product } from "../model/Product";
import { title } from "process";

class CatalogController {
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _page, _limit, _search } = req.query;
      const skip = ((Number(_page) || 1) - 1) * Number(_limit);
      const filters = {
        ...(_search &&
          _search !== "" && {
            $or: [{ title: { $regex: _search, $options: "i" } }].filter(
              Boolean
            ),
          }),
      };
      const query = Catalog.find(filters).skip(skip).limit(Number(_limit));
      const catalogs = await query;
      const countDocuments = await Catalog.countDocuments(filters);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Read Sucessfully!",
        data: catalogs,
        pagination: {
          page: Number(_page),
          limit: Number(_limit),
          totalPages: Math.ceil(countDocuments / Number(_limit)),
        },
      });
    } catch (error) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: true,
        message: "Read Error!",
        data: null,
        pagination: {},
      });
    }
  };
  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const catalog = await Catalog.findOne({ _id: req.params.id });
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Read Sucessfully!",
        data: catalog,
      });
    } catch (error) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Read Failed!",
        data: null,
      });
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.file) {
        req.body.imageUrl = `http://localhost:8888/uploads/category/${req.file.originalname}`;
      }
      const catalog = await Catalog.findOneAndUpdate(
        { _id: req.params.id },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Update Sucessfully!",
        data: catalog,
      });
    } catch (error) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Update Failed!",
        data: null,
      });
    }
  };
  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const values = {
        ...req.body,
        imageUrl: `http://localhost:8888/uploads/category/${req.file?.originalname}`,
      };
      const catalog = await Catalog.create(values);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Created!",
        data: catalog,
      });
    } catch (error) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Created failed",
        data: null,
      });
    }
  };
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isHasProduct = await Product.countDocuments({
        categoryID: req.params.id,
      });
      if (isHasProduct === 0) {
        await Catalog.findOneAndDelete({ _id: req.params.id });
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Delete Sucessfully!",
          data: null,
        });
      } else {
        res.status(StatusCodes.NOT_ACCEPTABLE).json({
          success: false,
          message: "Category has product. Can not delete!",
          data: null,
        });
      }
    } catch (error) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Delete Failed!",
        data: null,
      });
    }
  };
}

export const catalogController = new CatalogController();
