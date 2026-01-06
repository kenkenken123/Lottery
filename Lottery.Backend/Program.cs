using Microsoft.EntityFrameworkCore;
using Lottery.Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// 添加控制器服务
builder.Services.AddControllers();

// 配置 SQLite 数据库
builder.Services.AddDbContext<LotteryDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=lottery.db"));

// 配置 OpenAPI/Swagger
builder.Services.AddOpenApi();

// 配置 CORS 允许前端访问
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// 确保数据库已创建
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<LotteryDbContext>();
    db.Database.EnsureCreated();
}

// 配置 HTTP 管道
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// 启用 CORS
app.UseCors("AllowAll");

// 映射控制器路由
app.MapControllers();

app.Run();
