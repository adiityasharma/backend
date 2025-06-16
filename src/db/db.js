import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("MondoDB connected:", connectionInstance.connection.host)
  } catch (error) {
    console.log("Error found: ", error)
    process.exit(1)
  }
}

export default connectDB;