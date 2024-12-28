// require('dotenv').config({path: './env'});
import dotenv from "dotenv";
import connectToDB from "./db/mongo.js";

dotenv.config({
  path: "./env"
});

connectToDB();

/*
import express from "express";
const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.error(`Error connecting to the database: ${error}`);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    });

  } catch(error) {
    console.error(`Error: ${error}`);
    throw error;
  }
})();
*/
