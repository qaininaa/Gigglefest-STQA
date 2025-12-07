import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/index.routes.js";
import documentationRoutes from "./routes/documentation.routes.js";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to GiggleFest API",
    version: "1.0.0",
    server: "running",
    timestamp: new Date().toISOString(),
  });
});

// Metrics endpoint for performance monitoring
app.get("/metrics", (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    status: "success",
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    },
    memory: {
      rss: {
        bytes: memoryUsage.rss,
        mb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
      },
      heapTotal: {
        bytes: memoryUsage.heapTotal,
        mb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      },
      heapUsed: {
        bytes: memoryUsage.heapUsed,
        mb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      },
      external: {
        bytes: memoryUsage.external,
        mb: (memoryUsage.external / 1024 / 1024).toFixed(2),
      },
    },
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
    },
  });
});

app.use("/api/v1", routes);
app.use("/api-docs", documentationRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
