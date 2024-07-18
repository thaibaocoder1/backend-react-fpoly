import { connectDB } from "../utils/connect";

export const startDB = async (url: string) => {
  try {
    await connectDB(url);
    console.log("Mongodb is connected!!!");
  } catch (error) {
    console.log(error);
  }
};
