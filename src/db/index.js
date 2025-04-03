import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

console.log(process.env.MONGODB_URL);
const connectDB = async()=>{
    try{
        
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! DB HOST ${connectionInstance.connection.host}`);
        
    }
    catch(error){
        console.log("MONGO_DB connection error: ",error);
        process.exit(1);
    }
}
// connectDB()
export default connectDB;