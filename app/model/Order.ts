import { Schema, model } from "mongoose";

interface Orders extends Document {
  fullname: string;
  email: string;
  address: string;
  note: string;
  payment: string;
  status: number;
  userId: Schema.Types.ObjectId;
  cancelCount: number;
  deliveryFee: number;
  phone: string;
}

const orderSchema: Schema = new Schema<Orders>(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
    },
    payment: {
      type: String,
      default: "COD",
    },
    status: {
      type: Number,
      default: 1,
    },
    deliveryFee: {
      type: Number,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    cancelCount: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Order = model<Orders>("Order", orderSchema);
