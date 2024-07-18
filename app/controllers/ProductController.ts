import { Request, Response, NextFunction } from "express";
import { Product } from "../model/Product";
import { StatusCodes } from "http-status-codes";
import { Catalog } from "../model/Catalog";

class ProductController {
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        _page,
        _limit,
        _category,
        _search,
        _minPrice,
        _maxPrice,
        _sort,
        _rating,
      } = req.query;
      const condition = _category && _category !== "";
      let catalog: any;
      if (condition) catalog = await Catalog.findOne({ slug: _category });
      const skip = ((Number(_page) || 1) - 1) * Number(_limit);
      const filters = {
        categoryID: condition && catalog ? catalog._id : { $exists: true },
        ...(_search &&
          _search !== "" && {
            $or: [
              { name: { $regex: _search, $options: "i" } },
              { code: { $regex: _search, $options: "i" } },
            ].filter(Boolean),
          }),
        ...(_minPrice &&
          _maxPrice && {
            price: { $gte: Number(_minPrice), $lte: Number(_maxPrice) },
          }),
      };
      const pipeline = [
        { $match: filters },
        {
          $addFields: {
            averageRating: {
              $cond: {
                if: { $ne: ["$_rating", undefined] },
                then: { $avg: "$reviews.rating" },
                else: "$$REMOVE",
              },
            },
          },
        },
        {
          $match: {
            averageRating: _rating
              ? { $gte: Number(_rating) }
              : { $exists: true },
          },
        },
        { $skip: skip },
        { $limit: Number(_limit) },
        {
          $sort:
            _sort === "ASC"
              ? ({ price: 1 } as const)
              : ({ price: -1 } as const),
        },
        {
          $lookup: {
            from: "catalogs",
            localField: "categoryID",
            foreignField: "_id",
            as: "categoryID",
          },
        },
        {
          $unwind: "$categoryID",
        },
      ];
      const products = await Product.aggregate(pipeline).exec();
      const pipelineTotal = [
        { $match: filters },
        { $group: { _id: null, count: { $sum: 1 } } },
      ];
      const countPipelineResult = await Product.aggregate(pipelineTotal).exec();
      const totalProduct =
        countPipelineResult.length > 0 ? countPipelineResult[0].count : 0;
      if (products?.length === 0) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Read failed!",
          data: null,
          pagination: null,
        });
      } else {
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Read success!",
          data: products,
          pagination: {
            page: Number(_page),
            limit: Number(_limit),
            totalPages: Math.ceil(totalProduct / Number(_limit)),
          },
        });
      }
    } catch (error) {
      next(error);
    }
  };
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = Product.find();
      const products = await query;
      if (products?.length === 0) {
        throw new Error("Products list is empty!");
      }
      res.status(StatusCodes.OK).json({
        success: true,
        message: "READ",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };
  listRelated = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const product: any = await Product.findById({ _id: id }).populate(
        "categoryID"
      );
      const query = Product.find({
        categoryID: product?.categoryID._id,
        _id: { $ne: id },
      });
      const products = await query;
      if (products?.length === 0) {
        throw new Error("Products list is empty!");
      }
      res.status(StatusCodes.OK).json({
        success: true,
        message: "READ",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };
  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await Product.findById({ _id: req.params.id }).populate(
        "categoryID"
      );
      res.status(StatusCodes.OK).json({
        success: true,
        message: "GET",
        data: product,
      });
    } catch (error) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "GET",
        data: null,
      });
    }
  };
  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const obj = { ...req.body };
      if (req.files && typeof req.files === "object") {
        const mapList = Object.values(req.files).map((file) => {
          return {
            contentType: file.mimetype,
            fileName: `http://localhost:8888/uploads/product/${file.originalname}`,
          };
        });
        obj.thumb = mapList;
      }
      const existProduct = await Product.findOne({ code: obj.code });
      if (existProduct) {
        res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Duplicate product code. Try again!!",
          data: null,
        });
      } else {
        const product = await Product.create(obj);
        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Create successfully!",
          data: product,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  addReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId, ...data } = req.body;
      const product = await Product.findOne({ _id: productId });
      const updatedReviews = [...(product?.reviews || []), data];
      const updateProduct = await Product.findByIdAndUpdate(
        { _id: productId },
        {
          reviews: updatedReviews,
        },
        { runValidators: true, new: true }
      );
      if (updateProduct) {
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Read success",
          data: updateProduct,
        });
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Read failed!",
          data: null,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const obj = { ...req.body };
      const product = await Product.findById({ _id: req.params.id });
      const filteredThumb = product?.thumb.filter((image) => {
        return obj.imageUrl.includes(image._id.toString());
      });
      if (req.files && req.files.length === 0) {
        obj.thumb = filteredThumb;
        await Product.findOneAndUpdate({ _id: req.params.id }, obj, {
          new: true,
          runValidators: true,
        });
      } else {
        if (typeof req.files === "object" && product) {
          const mapList = Object.values(req.files).map((file) => {
            return {
              contentType: file.mimetype,
              fileName: `http://localhost:8888/uploads/product/${file.originalname}`,
            };
          });
          obj.thumb = [...mapList, ...product.thumb];
        }
        await Product.findOneAndUpdate({ _id: req.params.id }, obj, {
          new: true,
          runValidators: true,
        });
      }
      res.status(StatusCodes.CREATED).json({
        success: true,
        message: "Update successfully!",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };
  updateField = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = req.body;
      const updatePromises = list.map(async (update) => {
        const { productID: _id, ...updateData } = update;
        const updatedProduct = await Product.findByIdAndUpdate(
          _id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );
        if (!updatedProduct)
          throw new Error(`Product with id ${_id} not found`);
        return updatedProduct;
      });

      const updatedProducts = await Promise.allSettled(updatePromises);
      const errors = updatedProducts
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
          data: updatedProducts,
        });
      }
    } catch (error) {
      next(error);
    }
  };
}

export const productController = new ProductController();
