using Dinner_Server.Data;
using Dinner_Server.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=mealplanner.db"));

// OpenAPI / Swagger
builder.Services.AddOpenApi();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173"];
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Auto-migrate database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseStaticFiles();

// Map all endpoint groups
app.MapAuthEndpoints();
app.MapIngredientEndpoints();
app.MapRecipeEndpoints();
app.MapMealPlanEndpoints();
app.MapPantryEndpoints();
app.MapShoppingListEndpoints();
app.MapUserEndpoints();
app.MapIngredientPackageEndpoints();

// SPA fallback — serve index.html for non-API routes (when wwwroot/index.html exists)
app.MapFallbackToFile("index.html");

app.Run();
