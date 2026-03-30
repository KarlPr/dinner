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

// CORS (allow frontend dev server)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173")
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
app.UseStaticFiles(); // Serve uploaded images

// Map all endpoint groups
app.MapAuthEndpoints();
app.MapIngredientEndpoints();
app.MapRecipeEndpoints();
app.MapMealPlanEndpoints();
app.MapPantryEndpoints();
app.MapShoppingListEndpoints();
app.MapUserEndpoints();
app.MapIngredientPackageEndpoints();

app.Run();
