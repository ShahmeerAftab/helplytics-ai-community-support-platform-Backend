import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true, 
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role:{
      type:String,
       enum: ["need_help", "can_help", "both"],
       required: true,
    },
    skills:{
      type:[String],
      default:[]
    }
  },
);

export default mongoose.model("User", userSchema);
