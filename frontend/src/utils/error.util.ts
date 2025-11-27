import { AxiosError } from "axios";
import { ApiError } from "../types/common.types";

/**
 * Error handler utility for consistent error handling across the application
 * Enterprise-ready with proper logging and user-friendly messages
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public field?: string,
    public originalError?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const handleApiError = (error: unknown): AppError => {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const errorData = error.response?.data as ApiError;

    // Extract error message
    let message = "An unexpected error occurred";
    
    if (errorData?.detail) {
      message = errorData.detail;
    } else if (errorData?.message) {
      message = errorData.message;
    } else if (error.message) {
      message = error.message;
    }

    // Handle specific status codes
    switch (statusCode) {
      case 400:
        message = errorData?.detail || "Invalid request. Please check your input.";
        break;
      case 401:
        message = "Authentication required. Please login.";
        break;
      case 403:
        message = "You don't have permission to access this resource.";
        break;
      case 404:
        message = "The requested resource was not found.";
        break;
      case 500:
        message = "Server error. Please try again later.";
        break;
      case 503:
        message = "Service temporarily unavailable. Please try again later.";
        break;
    }

    return new AppError(message, statusCode, undefined, error);
  }

  // Handle standard errors
  if (error instanceof Error) {
    return new AppError(error.message, undefined, undefined, error);
  }

  // Handle unknown errors
  return new AppError("An unknown error occurred", undefined, undefined, error);
};

export const getFieldError = (error: unknown, field: string): string | null => {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data as ApiError;
    if (errorData && errorData[field]) {
      return Array.isArray(errorData[field])
        ? errorData[field][0]
        : errorData[field];
    }
  }
  return null;
};

export const getAllFieldErrors = (
  error: unknown
): Record<string, string> | null => {
  if (error instanceof AxiosError) {
    const errorData = error.response?.data as ApiError;
    if (!errorData) return null;

    const fieldErrors: Record<string, string> = {};
    
    Object.keys(errorData).forEach((key) => {
      if (key !== "detail" && key !== "message") {
        fieldErrors[key] = Array.isArray(errorData[key])
          ? errorData[key][0]
          : errorData[key];
      }
    });

    return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
  }
  return null;
};

export const logError = (
  context: string,
  error: unknown,
  metadata?: Record<string, any>
): void => {
  // Log errors (can check window.location for localhost)
  const isDevelopment = typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    
  if (isDevelopment) {
    console.group(`[Error] ${context}`);
    console.error("Error:", error);
    if (metadata) {
      console.log("Metadata:", metadata);
    }
    console.groupEnd();
  }
  
  // In production, send to error tracking service (e.g., Sentry)
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: metadata });
  // }
};
