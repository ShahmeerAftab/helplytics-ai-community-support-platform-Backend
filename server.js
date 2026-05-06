import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import requestRoutes from "./routes/request.routes.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Built-in middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").map(s => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Custom middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);

// Start server locally (not used on Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
export default app;
