using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RealTime.API.Data;
using RealTime.API.Hubs; // Required for TaskHub
using Microsoft.AspNetCore.Identity; // NEW
using Microsoft.AspNetCore.Authentication.JwtBearer; // NEW
using Microsoft.IdentityModel.Tokens; // NEW
using System.Text; // NEW

var builder = WebApplication.CreateBuilder(args);

// --- 1. SERVICES CONFIGURATION (builder.Services.Add...) ---

// Define the CORS policy name
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

// Register CORS service
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // Allow React's dev server origin
                          policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials(); // Essential for SignalR and future Auth
                      });
});

// Database Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 1. Identity Service: Adds user management capabilities
builder.Services.AddIdentity<IdentityUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// 2. JSON Serialization Fix: Required for Identity tables (to prevent cycle errors)
builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore
    );

// 3. JWT Authentication Service: Defines the token validation scheme
var jwtKey = builder.Configuration["JwtSettings:Key"];
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"];
var jwtAudience = builder.Configuration["JwtSettings:Audience"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// SignalR Service Registration
builder.Services.AddSignalR(); // <-- SignalR Service added here!

// API Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- 2. PIPELINE CONFIGURATION (app.Use... / app.Map...) ---

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 1. CORS Middleware (Must be before MapControllers)
app.UseCors(MyAllowSpecificOrigins);

// 2. Routing Middleware (Must be before Endpoints)
app.UseRouting(); // This enables routing features like MapHub

// IMPORTANT: Authentication must come BEFORE Authorization
app.UseAuthentication();

app.UseAuthorization();

// 3. SignalR Endpoint Mapping (The FIX!)
// This is where the /taskhub route is registered, resolving the 404 error.
app.MapHub<TaskHub>("/taskhub");

// 4. Controller Endpoint Mapping
app.MapControllers();

app.Run();
