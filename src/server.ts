import "dotenv/config";
import app from "./app";
// TODO: Import database initialization
// TODO: Import configuration

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    // TODO: Initialize database connection
    // TODO: Create tables if they don't exist
    // TODO: Seed initial data if needed

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on(
  "unhandledRejection",
  (reason: Error | any, promise: Promise<any>) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  }
);

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
