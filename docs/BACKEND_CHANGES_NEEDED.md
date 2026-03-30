# Backend Changes — Implemented

This document tracked backend changes identified during frontend development. All recommended changes have been implemented.

---

## Implemented Changes

### 1. `GET /api/auth/me` Endpoint — ✅ Implemented

Reads the `user_id` httponly cookie and returns the current user's `UserResponse`, or `401 Unauthorized` if the cookie is missing/invalid. The frontend calls this on mount to restore the session without needing client-side storage.

### 2. Configurable CORS Origins — ✅ Implemented

CORS allowed origins are now configurable via `Cors:AllowedOrigins` in `appsettings.json`. Defaults to `http://localhost:5173` for development.

### 3. Cookie SameSite/Secure Configuration — ✅ Implemented

Cookie `SameSite` and `Secure` options are now configurable via `Cookie:SameSite` and `Cookie:Secure` in `appsettings.json`, enabling cross-origin deployment (e.g., behind Tailscale).

### 4. SPA Fallback + wwwroot — ✅ Implemented

`wwwroot/` directory created and `MapFallbackToFile("index.html")` added, allowing the backend to serve the frontend build for single-container deployment.
