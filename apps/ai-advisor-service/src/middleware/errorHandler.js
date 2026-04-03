import env from "../config/env.js";

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const payload = {
    error: error?.message || "Internal server error",
  };

  if (error?.details && statusCode < 500) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    payload.error = "Internal server error";
  }

  if (!env.isProduction && error?.details && statusCode >= 500) {
    payload.details = error.details;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
