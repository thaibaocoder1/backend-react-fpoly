import { Schema, model } from "mongoose";

interface Coupons extends Document {
  name: string;
  value: number;
  expireIns: number;
}

const couponSchema = new Schema<Coupons>(
  {
    name: { type: String, required: true },
    value: { type: Number, required: true },
    expireIns: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Coupon = model<Coupons>("Coupon", couponSchema);
