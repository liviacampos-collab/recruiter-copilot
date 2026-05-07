/**
 * Base URL for the analyze API. Empty string = same origin (`/api/analyze`), used on Vercel.
 * For local dev with `node server.js`, set `VITE_API_BASE_URL=http://localhost:3001` or rely on the Vite proxy.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
