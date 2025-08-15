import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI is not defined in environment variables");
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongodb Connected !!!");
  } catch (error) {
    console.error("Mongodb Connection error !!!", error);
    process.exit(1);
  }
};

export default connectDB;
