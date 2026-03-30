using Api.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Persistance ──────────────────────────────────────────────────────────────
builder.Services.AddPersistance(builder.Configuration);

// ── Services ──────────────────────────────────────────────────────────────
builder.Services.AddBusinessService();

// ── JWT Authentication ────────────────────────────────────────────────────
var jwtKey = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.MapInboundClaims = false;
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,  // no grace period
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// ── Swagger with JWT support ──────────────────────────────────────────────
//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen(c =>
//{
//    c.SwaggerDoc("v1", new OpenApiInfo { Title = "JwtAuthApi", Version = "v1" });
//    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
//    {
//        Name = "Authorization",
//        Type = SecuritySchemeType.Http,
//        Scheme = "Bearer",
//        BearerFormat = "JWT",
//        In = ParameterLocation.Header,
//        Description = "Paste your access token here. No need to type 'Bearer ' — Swagger adds it."
//    });
//    c.AddSecurityRequirement(new OpenApiSecurityRequirement
//    {
//        {
//            new OpenApiSecurityScheme
//            {
//                Reference = new OpenApiReference
//                {
//                    Type = ReferenceType.SecurityScheme,
//                    Id   = "Bearer"
//                }
//            },
//            []
//        }
//    });
//});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();