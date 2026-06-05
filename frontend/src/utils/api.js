/**
 * Utility to resolve the API base URL dynamically.
 * - If NEXT_PUBLIC_API_URL env variable is provided, use it.
 * - Otherwise, if running on localhost (dev), default to localhost:8000.
 * - In production Vercel, default to the multi-service relative path prefix /_/backend.
 */
export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:8000";
    }
    // Return relative path prefix for Vercel multi-service routing
    return "/_/backend";
  }
  
  return "http://localhost:8000";
};
