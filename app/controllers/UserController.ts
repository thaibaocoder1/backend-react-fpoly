import { Request, Response, NextFunction } from "express";
import { User } from "../model/User";
import { StatusCodes } from "http-status-codes";
import { generateToken, decodeToken } from "../../auth/AuthController";
import mailer from "../../middleware/mailer";
import bcrypt from "bcrypt";

class UserController {
  // Get all
  index = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _page, _limit, _search, _all } = req.query;
      const skip = ((Number(_page) || 1) - 1) * Number(_limit);
      const filters = {
        ...(_search &&
          _search !== "" && {
            $or: [
              { username: { $regex: _search, $options: "i" } },
              { email: { $regex: _search, $options: "i" } },
              { fullname: { $regex: _search, $options: "i" } },
            ].filter(Boolean),
          }),
      };
      const query = User.find(_all ? {} : filters)
        .skip(skip)
        .limit(Number(_limit));
      const users = await query;
      const totalUsers = await User.countDocuments(_all ? {} : filters);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "READ",
        data: users,
        pagination: {
          page: Number(_page),
          limit: Number(_limit),
          totalPages: Math.ceil(totalUsers / Number(_limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  };
  // Get all [DELETE]
  trash = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { _page, _limit, _search } = req.query;
      const skip = ((Number(_page) || 1) - 1) * Number(_limit);
      const filters = {
        deleted: true,
        ...(_search &&
          _search !== "" && {
            $or: [
              { username: { $regex: _search, $options: "i" } },
              { email: { $regex: _search, $options: "i" } },
              { fullname: { $regex: _search, $options: "i" } },
            ].filter(Boolean),
          }),
      };
      const query = User.findWithDeleted(filters)
        .skip(skip)
        .limit(Number(_limit));
      const users = await query;
      console.log("🚀 ~ UserController ~ trash= ~ users:", users);
      const totalUsers = await User.countDocuments(filters);
      res.status(StatusCodes.OK).json({
        success: true,
        message: "READ",
        data: users,
        pagination: {
          page: Number(_page),
          limit: Number(_limit),
          totalPages: Math.ceil(totalUsers / Number(_limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  };
  // Get one
  detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findOne({ _id: req.params.id });
      if (user && user !== null) {
        res.status(StatusCodes.OK).json({
          success: true,
          data: user,
        });
      } else {
        res.status(StatusCodes.OK).json({
          success: false,
          message: "User has delete!",
          data: user,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  // Add
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = { ...req.body };
      const salt = bcrypt.genSaltSync(10);
      if (req.file) {
        value.imageUrl = {
          data: req.file.originalname,
          contentType: req.file.mimetype,
          fileName: `http://localhost:8888/uploads/account/${req.file.originalname}`,
        };
      } else {
        value.imageUrl = {
          data: Buffer.from(""),
          contentType: "Empty Type!",
          fileName: "https://placehold.co/350x350",
        };
      }
      const userExist = await User.findOne({ email: value.email });
      if (userExist) {
        res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Duplicate user!",
          data: null,
        });
      } else {
        let user: any;
        const hashPassword: string = await bcrypt.hash(value.password, salt);
        value.password = hashPassword;
        value.retypePassword = hashPassword;
        value.isActive = true;
        user = await User.create(value);
        if (user) {
          res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Created User Successfully!",
            data: user,
          });
        } else {
          res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Lỗi khi tạo tài khoản.",
            data: null,
          });
        }
      }
    } catch (error) {
      next(error);
    }
  };
  // Update
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById({ _id: req.params.id });
      if (user) {
        if (!req.file) {
          delete req.body.imageUrl;
          const data = await User.findByIdAndUpdate(
            { _id: req.params.id },
            req.body,
            {
              new: true,
              runValidators: true,
            }
          );
          res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Update successfully",
            data,
          });
        } else {
          req.body.imageUrl = {
            data: req.file.originalname,
            contentType: req.file.mimetype,
            fileName: `http://localhost:8888/uploads/account/${req.file.originalname}`,
          };
          const data = await User.findByIdAndUpdate(
            { _id: req.params.id },
            req.body,
            {
              new: true,
              runValidators: true,
            }
          );
          res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Update successfully",
            data,
          });
        }
      } else {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "User is not exist in system",
          data: null,
        });
      }
    } catch (error) {
      next(error);
    }
  };
  updateFields = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById({ _id: req.params.id });
      const { oldPassword, password, retypePassword } = req.body;
      if (user) {
        const isValidPassword = await bcrypt.compare(
          oldPassword,
          user.password
        );
        if (isValidPassword) {
          if (oldPassword === password) {
            return res.status(StatusCodes.CONFLICT).json({
              success: false,
              message: "Mật khẩu mới không được trùng với mật khẩu cũ.",
              data: null,
            });
          } else {
            const salt = bcrypt.genSaltSync(10);
            const hashPassword = bcrypt.hashSync(password, salt);
            const hashCPassword = bcrypt.hashSync(retypePassword, salt);
            const user = await User.findOneAndUpdate(
              { _id: req.params.id },
              { password: hashPassword, retypePassword: hashCPassword },
              { new: true }
            );
            return res.status(StatusCodes.CREATED).json({
              success: true,
              message: "Đổi mật khẩu thành công",
              data: user,
            });
          }
        } else {
          return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: "Mật khẩu không trùng với hệ thống!",
            data: null,
          });
        }
      } else {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: "failed",
          message: "Password not match!!",
          data: null,
        });
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        message: "ERROR froms server",
      });
    }
  };
  cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, cancelCount } = req.body;
      const user = await User.findById({ _id: userId });
      let cancelCountTemp = 0;
      if (user) {
        cancelCountTemp = user.cancelCount as number;
        cancelCountTemp++;
        await User.updateOne(
          { _id: userId },
          {
            $set: { cancelCount: cancelCountTemp },
          },
          { new: true, runValidators: true }
        );
        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Update successfully!",
          data: user,
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
  // Delete
  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await User.findOneDeleted({ _id: id });
      if (user) {
        await User.deleteOne({ _id: id, deleted: true });
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Remove successfully!",
          data: null,
        });
      } else {
        res.status(StatusCodes.OK).json({
          success: false,
          message: "Remove failed!",
          data: null,
        });
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        message: "ERROR froms server",
        data: null,
      });
    }
  };
  softDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await User.findOne({ _id: id });
      if (user) {
        if (user.role.toLowerCase() === "user") {
          const content = `<b>Tài khoản của bạn đã bị khoá bởi vi phạm chính sách của website BSmart. Vui lòng chờ 1 ngày sau khi nhận được email này để khôi phục tài khoản. Xin cảm ơn!`;
          (await mailer.createTransporter()).sendMail({
            from: "BSmart ADMIN",
            to: user.email,
            subject: "Thông báo về việc ngừng kích hoạt tài khoản tại BSmart ✔",
            text: "Thông báo về việc ngừng kích hoạt tài khoản tại BSmart",
            html: content,
          });
          await User.delete({ _id: id });
          res.status(StatusCodes.OK).json({
            success: true,
            message: "Remove successfully!",
            data: null,
          });
        } else {
          res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: "Can't remove admin account!",
            data: null,
          });
        }
      } else {
        await User.deleteOne({ _id: id, deleted: true });
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Remove successfully!",
          data: null,
        });
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        message: "ERROR froms server",
        data: null,
      });
    }
  };
  // Auth
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOneWithDeleted({
        email: email,
      });
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Tài khoản không tồn tại",
          data: null,
        });
      }
      if (!user.isActive) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Tài khoản chưa được kích hoạt",
          data: null,
        });
      }
      if (user?.deleted) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Tài khoản đã ngừng kích hoạt",
          data: null,
        });
      }
      const isPasswordValid: boolean = await bcrypt.compare(
        password,
        user.password
      );
      if (!isPasswordValid) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: "Mật khẩu không chính xác.",
          data: null,
        });
      }
      if (!email || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Missing required information: 'email or password'",
          data: null,
        });
      }
      const accessTokenLife: string = <string>process.env.ACCESS_TOKEN_LIFE;
      const refreshTokenLife: string = <string>process.env.REFRESH_TOKEN_LIFE;
      const accessTokenSecret: string = <string>process.env.ACCESS_TOKEN_SECRET;
      const refreshTokenSecret: string = <string>(
        process.env.REFRESH_TOKEN_SECRET
      );
      const dataForAccessToken = {
        email: user.email,
      };
      const accessToken = await generateToken(
        dataForAccessToken,
        accessTokenSecret,
        accessTokenLife
      );
      let refreshToken = await generateToken(
        dataForAccessToken,
        refreshTokenSecret,
        refreshTokenLife
      );
      if (!user.refreshToken) {
        await User.findOneAndUpdate(
          { email: email },
          { refreshToken: refreshToken }
        );
      } else {
        refreshToken = user.refreshToken;
      }
      if (user.role === "User") {
        res.cookie("refreshToken", refreshToken, {
          secure: false,
          httpOnly: true,
          path: "/",
          expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE)),
        });
        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Created",
          data: {
            user,
            accessToken,
            refreshToken,
          },
        });
      } else {
        res.cookie("refreshTokenAdmin", refreshToken, {
          secure: false,
          httpOnly: true,
          path: "/",
          expires: new Date(Date.now() + Number(process.env.COOKIE_EXPIRE)),
        });
        res.status(StatusCodes.CREATED).json({
          success: true,
          message: "Created",
          data: {
            user,
            accessToken,
            refreshToken,
          },
        });
      }
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error from server!",
        data: null,
      });
    }
  };
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = req.body;
      const salt = bcrypt.genSaltSync(10);
      value.imageUrl = {
        data: Buffer.from(""),
        contentType: "Empty Type!",
        fileName: "https://placehold.co/350x350",
      };
      const userExist = await User.findOne({ email: value.email });
      if (userExist) {
        res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Duplicate user!",
          data: null,
        });
      } else {
        let user: any;
        const hashPassword: string = await bcrypt.hash(value.password, salt);
        const hashCPassowrd: string = await bcrypt.hash(
          value.retypePassword,
          salt
        );
        value.password = hashPassword;
        value.retypePassword = hashCPassowrd;
        user = await User.create(value);
        const content = `<b>Vui lòng click vào đường link này để xác thực việc kích hoạt tài khoản. <a href="http://localhost:5173/auth/active/${user._id}">Xác thực</a></b>`;
        (await mailer.createTransporter()).sendMail({
          from: "BSmart ADMIN",
          to: user.email,
          subject: "Kích hoạt tài khoản tại hệ thống BSmart ✔",
          text: "Kích hoạt tài khoản tại hệ thống BSmart",
          html: content,
        });
        if (user) {
          res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Created User Successfully!",
            data: null,
            created: true,
          });
        } else {
          res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Lỗi khi tạo tài khoản.",
            data: null,
          });
        }
      }
    } catch (error) {
      next(error);
    }
  };
  active = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.body;
      const user = await User.findById({ _id: id });
      if (!user) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Tài khoản không tồn tại!",
          isActive: false,
        });
      } else {
        const now = Math.floor(Date.now());
        let timeCreated = 0;
        if (user?.createdAt instanceof Date) {
          timeCreated = Math.floor(new Date(user?.createdAt).getTime());
        }
        if (user?.isActive === true) {
          res.status(StatusCodes.OK).json({
            success: true,
            isActive: false,
            message: "Account has already active!",
          });
        } else {
          if (now - timeCreated > 5 * 60 * 1000) {
            await User.deleteOne({ _id: id });
            return res.status(StatusCodes.UNAUTHORIZED).json({
              success: false,
              message: "Tài khoản đã hết hạn active.",
              isActive: false,
            });
          } else {
            await User.findOneAndUpdate(
              { _id: id },
              { isActive: true },
              { new: true }
            );
            res.status(StatusCodes.CREATED).json({
              success: true,
              message: "Kích hoạt tài khoản thành công",
              isActive: true,
            });
          }
        }
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error from SERVER!",
        data: null,
      });
    }
  };
  forgot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.body);
      const { email } = req.body;
      const user = await User.findOne({ email });
      const content = `<b>Vui lòng click vào đường link này để xác thực việc lấy lại mật khẩu. <a href="http://localhost:5173/auth/reset/${user?.id}">Xác thực</a></b>`;
      if (user) {
        (await mailer.createTransporter()).sendMail({
          from: "BSmart ADMIN",
          to: user.email,
          subject: "Xác thực việc lấy lại mật khẩu tại BSmart ✔",
          text: "Xác thực việc lấy lại mật khẩu tại BSmart",
          html: content,
        });
        await User.findOneAndUpdate(
          { email },
          { $set: { resetedAt: new Date().getTime() } }
        );
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Kiểm tra email để xác thực",
          data: user,
        });
      } else {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Không có tài khoản nào được tìm thấy.",
          data: null,
        });
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error from SERVER!",
        data: null,
      });
    }
  };
  reset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const values = { ...req.body };
      const user = await User.findOne({ _id: values._id });
      if (user) {
        const now = Math.floor(Date.now() / 1000);
        const timer = Math.floor((user?.resetedAt as number) / 1000);
        if (user.resetedAt === 0) {
          res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Account has already reset!",
            data: null,
          });
        } else {
          if (now - timer > 300) {
            await User.findByIdAndUpdate(
              { _id: values._id },
              { $unset: { resetedAt: 1 } }
            );
            res.status(StatusCodes.NOT_FOUND).json({
              success: false,
              message: "Reset failed. Time reset expire!",
              data: null,
            });
          } else {
            const salt = bcrypt.genSaltSync(10);
            const hashPassword = bcrypt.hashSync(values.password, salt);
            const hashCPassword = bcrypt.hashSync(values.retypePassword, salt);
            values.password = hashPassword;
            values.retypePassword = hashCPassword;
            const user = await User.findOneAndUpdate(
              { _id: values._id },
              {
                password: values.password,
                retypePassword: values.retypePassword,
                resetedAt: 0,
              },
              {
                new: true,
                runValidators: true,
              }
            );
            res.status(StatusCodes.OK).json({
              success: true,
              message: "Reset successfully!",
              data: user,
            });
          }
        }
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error from SERVER!",
        data: null,
      });
    }
  };
  recover = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const user = await User.findOneWithDeleted({ email });
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Tài khoản không tồn tại",
          data: null,
        });
      } else {
        if (user.deleted) {
          const salt = bcrypt.genSaltSync(15);
          const hash = bcrypt.hashSync(email, salt);
          const content = `<b>Vui lòng click vào đường link này để xác thực việc khôi phục tài khoản. <a href="http://localhost:5173/auth/confirm/?id=${user._id}&hash=${hash}">Xác thực</a></b>`;
          (await mailer.createTransporter()).sendMail({
            from: "BSmart ADMIN",
            to: user.email,
            subject: "Xác thực việc khôi phục tài khoản tại BSmart ✔",
            text: "Xác thực việc khôi phục tài khoản tại BSmart",
            html: content,
          });
          await User.findOneAndUpdateDeleted(
            {
              email,
            },
            {
              recoverHashCode: hash,
              timeExpireRecover: Date.now() + 86400000,
            }
          );
          return res.status(StatusCodes.OK).json({
            success: true,
            message: "Kiểm tra email để xác thực",
            data: null,
          });
        } else {
          return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Tài khoản đã bị xoá vĩnh viễn!",
            data: null,
          });
        }
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error from SERVER!",
        data: null,
      });
    }
  };
  confirm = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { hash, id } = req.body;
      const user = await User.findOneWithDeleted({ _id: id, deleted: true });
      if (user) {
        const match = hash === user.recoverHashCode;
        const now = Math.floor(Date.now());
        const expireIns = Math.floor(user.timeExpireRecover as number);
        if (match && now < expireIns) {
          return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Thời gian tối thiểu khôi phục là 1 ngày!",
            data: null,
          });
        } else {
          await User.restore({
            _id: id,
          });
          const user = await User.findOneAndUpdateDeleted(
            {
              _id: id,
            },
            {
              $unset: {
                recoverHashCode: 1,
                timeExpireRecover: 1,
              },
            },
            {
              new: true,
            }
          );
          return res.status(StatusCodes.CREATED).json({
            success: true,
            message: "Khôi phục tài khoản thành công",
            user,
          });
        }
      } else {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Không thể khôi phục tài khoản!",
          data: null,
        });
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error from SERVER!",
      });
    }
  };
  restore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.body;
      const user = await User.findOneDeleted({ _id: id });
      if (user) {
        await User.restore({ _id: id });
        await User.findOneAndUpdate(
          { _id: id },
          {
            $unset: {
              recoverHashCode: 1,
              timeExpireRecover: 1,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Restore successfully!",
          data: user,
        });
      } else {
        res.status(StatusCodes.OK).json({
          success: false,
          message: "Restore failed!",
          data: user,
        });
      }
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "failed",
        message: "ERROR froms server",
        data: null,
      });
    }
  };
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await User.findById({ _id: id });
      if (!user) {
        res.status(StatusCodes.OK).json({
          success: false,
          message: "User not exist to find!",
          data: null,
        });
      } else {
        await User.findOneAndUpdate(
          { _id: id },
          {
            refreshToken: "",
            cart: req.body.cart,
            coupon: req.body.coupon,
            wishlist: req.body.wishlist,
          },
          { new: true, runValidators: true }
        );
      }
      if (user?.role.toLowerCase() === "user") {
        res.clearCookie("refreshToken");
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Logout successfully!",
          data: user,
        });
      } else {
        res.clearCookie("refreshTokenAdmin");
        res.status(StatusCodes.OK).json({
          success: true,
          message: "Logout successfully!",
          data: user,
        });
      }
    } catch (error) {
      console.log("🚀 ~ UserController ~ logout= ~ error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error from SERVER!",
        data: null,
      });
    }
  };
}

export const userController = new UserController();
