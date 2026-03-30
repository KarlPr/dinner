using Dinner_Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Dinner_Server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<RecipeIngredient> RecipeIngredients => Set<RecipeIngredient>();
    public DbSet<MealPlan> MealPlans => Set<MealPlan>();
    public DbSet<PantryItem> PantryItems => Set<PantryItem>();
    public DbSet<IngredientPackage> IngredientPackages => Set<IngredientPackage>();
    public DbSet<ShoppingList> ShoppingLists => Set<ShoppingList>();
    public DbSet<ShoppingListItem> ShoppingListItems => Set<ShoppingListItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Name).IsUnique();
            e.Property(u => u.Name).HasMaxLength(100).IsRequired();
            e.Property(u => u.PasswordHash).IsRequired();
        });

        // Ingredient
        modelBuilder.Entity<Ingredient>(e =>
        {
            e.HasIndex(i => i.Name).IsUnique();
            e.Property(i => i.Name).HasMaxLength(200).IsRequired();
            e.Property(i => i.BaseUnit).HasMaxLength(10).IsRequired();
        });

        // Recipe
        modelBuilder.Entity<Recipe>(e =>
        {
            e.Property(r => r.Name).HasMaxLength(200).IsRequired();
            e.HasOne(r => r.Creator)
                .WithMany(u => u.Recipes)
                .HasForeignKey(r => r.CreatedBy);
        });

        // RecipeIngredient
        modelBuilder.Entity<RecipeIngredient>(e =>
        {
            e.HasOne(ri => ri.Recipe)
                .WithMany(r => r.Ingredients)
                .HasForeignKey(ri => ri.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ri => ri.Ingredient)
                .WithMany(i => i.RecipeIngredients)
                .HasForeignKey(ri => ri.IngredientId);
        });

        // MealPlan
        modelBuilder.Entity<MealPlan>(e =>
        {
            e.Property(m => m.Date).HasMaxLength(10).IsRequired();
            e.Property(m => m.MealType).HasMaxLength(20).IsRequired();
            e.HasOne(m => m.Recipe)
                .WithMany(r => r.MealPlans)
                .HasForeignKey(m => m.RecipeId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(m => m.User)
                .WithMany(u => u.MealPlans)
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // PantryItem
        modelBuilder.Entity<PantryItem>(e =>
        {
            e.HasIndex(p => p.IngredientId).IsUnique();
            e.HasOne(p => p.Ingredient)
                .WithOne(i => i.PantryItem)
                .HasForeignKey<PantryItem>(p => p.IngredientId);
        });

        // IngredientPackage
        modelBuilder.Entity<IngredientPackage>(e =>
        {
            e.Property(p => p.Label).HasMaxLength(100).IsRequired();
            e.Property(p => p.Unit).HasMaxLength(10).IsRequired();
            e.HasOne(p => p.Ingredient)
                .WithMany(i => i.Packages)
                .HasForeignKey(p => p.IngredientId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ShoppingList
        modelBuilder.Entity<ShoppingListItem>(e =>
        {
            e.HasOne(si => si.ShoppingList)
                .WithMany(s => s.Items)
                .HasForeignKey(si => si.ShoppingListId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(si => si.Ingredient)
                .WithMany()
                .HasForeignKey(si => si.IngredientId);
        });
    }
}
