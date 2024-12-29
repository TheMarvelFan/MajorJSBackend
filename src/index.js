// require('dotenv').config({path: './env'});
import dotenv from "dotenv";
import connectToDB from "./db/mongo.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env"
});

connectToDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port: ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.error(`MongoDB Connection failed: ${err}`);
    throw err;
  });

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
