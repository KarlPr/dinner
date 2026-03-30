# Backend Changes Needed for Frontend

This document lists backend changes that would improve the frontend experience. These were identified during frontend development but not implemented, to avoid modifying backend source code.

---

## Recommended Changes

### 1. Add `GET /api/auth/me` Endpoint

**Priority**: High  
**Reason**: The frontend needs to identify the currently logged-in user on page refresh. The `user_id` cookie is `httponly` (correct for security), so JavaScript cannot read it.

**Current workaround**: The frontend stores the user info in `sessionStorage` on login, then validates by calling `GET /api/users/{id}` on mount. This works but is fragile — if sessionStorage is cleared while the cookie is still valid, the user appears logged out even though their session is active.

**Proposed implementation**:

```csharp
group.MapGet("/me", async (HttpContext http, AppDbContext db) =>
{
    if (!http.Request.Cookies.TryGetValue("user_id", out var userIdStr) 
        || !int.TryParse(userIdStr, out var userId))
        return Results.Unauthorized();

    var user = await db.Users.FindAsync(userId);
    if (user is null)
        return Results.Unauthorized();

    return Results.Ok(new UserResponse(user.Id, user.Name, user.Email));
});
```

**Response**: `200 OK` with `UserResponse` or `401 Unauthorized`.

This would let the frontend call `GET /api/auth/me` on mount to restore the session without needing sessionStorage.

---

### 2. CORS Cookie Configuration for Production

**Priority**: Medium  
**Reason**: The current CORS policy only allows `http://localhost:5173`. For production deployment (e.g., behind Tailscale), the policy needs to include the production origin, or use a dynamic origin based on configuration.

**Proposed change** in `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

And in `appsettings.json`:
```json
{
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173"]
  }
}
```

---

### 3. Cookie SameSite for Cross-Origin (Tailscale)

**Priority**: Medium  
**Reason**: The current cookie uses `SameSite = Strict`, which won't work when the frontend and backend are on different Tailscale hostnames.

**Proposed change**: For production, switch to `SameSite = Lax` or `None` (with `Secure = true`) depending on deployment topology:

```csharp
http.Response.Cookies.Append("user_id", user.Id.ToString(), new CookieOptions
{
    HttpOnly = true,
    SameSite = SameSiteMode.Lax,  // or None for cross-origin
    Secure = true,                 // required for SameSite=None
    MaxAge = TimeSpan.FromDays(30)
});
```

---

### 4. Serve Frontend Static Files

**Priority**: Low (only for single-container deployment)  
**Reason**: For Docker deployment, it's convenient to serve the frontend build from the ASP.NET server. The backend already calls `app.UseStaticFiles()` but the warning shows `wwwroot` doesn't exist.

**Proposed change**: After building the frontend, copy `frontend/dist/` to `backend/Dinner-Server/wwwroot/` and add SPA fallback:

```csharp
app.UseStaticFiles();
app.MapFallbackToFile("index.html");
```

---

## Not Required (Informational)

### User Endpoint Auth Check

The `GET /api/users/{id}` endpoint does not require authentication — it returns user data for any valid ID. This is currently used by the frontend for session validation. If `GET /api/auth/me` is added, the users endpoint could optionally require authentication.

### Image Upload WebRootPath Warning

The backend logs a warning about missing `wwwroot`. The `UseStaticFiles()` call is needed for serving uploaded recipe images from the `uploads/` directory. This works but the warning is noisy. Consider either:
- Creating an empty `wwwroot/` directory
- Or configuring `StaticFileOptions` to only serve from the `uploads/` path
