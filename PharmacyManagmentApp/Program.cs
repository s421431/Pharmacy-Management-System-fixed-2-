using Microsoft.EntityFrameworkCore;
using Infrastructure.Context;
using Infrastructure.DataSeeders;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. CORS CONFIGURATION
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:8080")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// 2. AUTOMATED ASSEMBLY SCANNER FOR DEPENDENCIES
var applicationAssembly = typeof(Application.Services.Auth.AuthService).Assembly;
var infrastructureAssembly = typeof(PharmacyDbContext).Assembly;

builder.Services.Scan(scan => scan
    .FromAssemblies(applicationAssembly, infrastructureAssembly)
    .AddClasses(classes => classes.Where(c => 
        c.Name.EndsWith("Service") || 
        c.Name.EndsWith("Repository") || 
        c.Name.EndsWith("UnitOfWork") ||
        c.Name.Contains("Repository") ||
        c.Name.Contains("UnitOfWork")))
    .AsMatchingInterface()
    .AsImplementedInterfaces()
    .WithScopedLifetime());

builder.Services.AddScoped(typeof(Domain.IRepositories.IRepository<,>), typeof(Infrastructure.Repositories.Repository<,>));

// 3. XAMPP MYSQL CONNECTION
builder.Services.AddDbContext<PharmacyDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

// 4. ASP.NET IDENTITY MANAGEMENT
builder.Services.AddIdentityCore<Domain.Entities.User>()
    .AddRoles<Domain.Entities.Role>()
    .AddEntityFrameworkStores<PharmacyDbContext>()
    .AddDefaultTokenProviders();

// 5. JWT BEARER AUTHENTICATION
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
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
    };
});

var app = builder.Build();

app.UseCors("AllowReactApp");

// 6. AUTO-CREATE TABLES AND SEED SECURITY PROFILES
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<PharmacyDbContext>();
    dbContext.Database.EnsureCreated();

    // Core Identity Initializations
    var services = scope.ServiceProvider;
    IdentitySeedData.Initialize(services).Wait();
    ReferenceDataSeedData.Initialize(services).Wait();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();