import { Schema, model } from "mongoose";

interface Catalogs extends Document {
  title: string;
  slug: string;
  imageUrl: string;
}

const catalogSchema: Schema = new Schema<Catalogs>(
  {
    title: {
      type: String,
      required: [true, "Title should not be empty!"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Catalog = model<Catalogs>("Catalog", catalogSchema);
