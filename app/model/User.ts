import { Schema, model } from "mongoose";
import MongooseDelete from "mongoose-delete";

interface UsersCart extends Document {
  userId: Schema.Types.ObjectId;
  quantity: number;
  productId: Schema.Types.ObjectId;
  isBuyNow: boolean;
}
interface UsersCoupon extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  value: number;
}
const usersCartSchema = new Schema<UsersCart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    isBuyNow: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
);
const usersCouponSchema = new Schema<UsersCoupon>(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

interface Users extends MongooseDelete.SoftDeleteDocument {
  fullname: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  retypePassword: string;
  role: string;
  imageUrl?: Object;
  isActive: boolean;
  cancelCount: number;
  cart: UsersCart[];
  coupon: UsersCoupon[];
  wishlist: string[];
  refreshToken: string;
  recoverHashCode?: string;
  createdAt?: Date;
  resetedAt?: number;
  timeExpireRecover?: number;
}

const userSchema = new Schema<Users>(
  {
    fullname: {
      type: String,
      required: [true, "Fullname should not be empty!"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username should not be empty!"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email should not be empty!"],
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone should not be empty!"],
    },
    password: {
      type: String,
    },
    retypePassword: {
      type: String,
    },
    role: {
      type: String,
      default: "User",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    cancelCount: {
      type: Number,
      default: 0,
    },
    cart: {
      type: [usersCartSchema],
      default: [],
    },
    coupon: {
      type: [usersCouponSchema],
      default: [],
    },
    wishlist: {
      type: [],
      default: [],
    },
    imageUrl: {
      data: Buffer,
      contentType: String,
      fileName: String,
    },
    refreshToken: {
      type: String,
    },
    recoverHashCode: {
      type: String,
    },
    resetedAt: {
      type: Number,
    },
    timeExpireRecover: {
      type: Number,
    },
  },
  { timestamps: true }
);

userSchema.plugin(MongooseDelete, {
  deletedAt: true,
  overrideMethods: true,
});

export const User = model<Users>(
  "User",
  userSchema
) as MongooseDelete.SoftDeleteModel<Users>;
