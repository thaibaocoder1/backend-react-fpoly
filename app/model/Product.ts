import { Schema, model } from "mongoose";

interface Images extends Document {
  _id: Schema.Types.ObjectId;
  contentType: string;
  fileName: string;
}
interface Reviews extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  content: string;
  fullname: string;
  rating: Number;
}
const imageSchema: Schema = new Schema<Images>({
  contentType: { type: String, required: true },
  fileName: { type: String, required: true },
});
const reviewSchema: Schema = new Schema<Reviews>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String, required: true },
    fullname: { type: String, required: true },
    rating: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);
interface Products extends Document {
  categoryID: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  thumb: Images[];
  reviews: Reviews[];
  content: string;
  quantity: number;
}
const productSchema: Schema = new Schema(
  {
    categoryID: { type: Schema.Types.ObjectId, required: true, ref: "Catalog" },
    name: { type: String, required: true },
    code: { type: String, unique: true },
    slug: { type: String, unique: true },
    description: { type: String },
    price: { type: Number },
    discount: { type: Number, default: 0 },
    thumb: { type: [imageSchema], default: [] },
    reviews: { type: [reviewSchema], default: [] },
    content: { type: String },
    quantity: { type: Number },
  },
  {
    timestamps: true,
  }
);

export const Product = model<Products>("Product", productSchema);
