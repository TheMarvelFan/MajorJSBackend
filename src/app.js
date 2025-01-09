import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({
  limit: "32kb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "32kb"
}));

app.use(express.static("public"));

app.use(cookieParser());

// routes imported
import userRoutes from "./routes/user.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";
import videoRoutes from "./routes/video.routes.js";
import tweetRoutes from "./routes/tweet.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import healthcheckRoutes from "./routes/healthcheck.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

// routes declared
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/comment", commentRoutes);
app.use("/api/v1/like", likeRoutes);
app.use("/api/v1/video", videoRoutes);
app.use("/api/v1/subscription", subscriptionRoutes);
app.use("/api/v1/tweet", tweetRoutes);
app.use("/api/v1/playlist", playlistRoutes);
app.use("/api/v1/healthcheck", healthcheckRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
// https://localhost:8000/api/v1/users/register

export { app };
