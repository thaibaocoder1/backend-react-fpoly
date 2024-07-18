import { Schema, model } from "mongoose";

interface Details extends Document {
  orderID: Schema.Types.ObjectId;
  productID: Schema.Types.ObjectId;
  quantity: number;
  price: number;
}

const detailSchema: Schema = new Schema<Details>(
  {
    orderID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    productID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    quantity: {
      type: Number,
    },
    price: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Detail = model<Details>("Detail", detailSchema);
