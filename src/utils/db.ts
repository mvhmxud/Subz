import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not defined in environment variables");
  process.exit(1);
}

export const db_connetion = (callback: () => void) => {
  mongoose
    .connect(DATABASE_URL)
    .then(() => {
      console.log("Database connected successfully 🔌");
      callback();
    })
    .catch((error) => {
      console.log(error);
    });
};
