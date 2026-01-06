using Microsoft.EntityFrameworkCore;
using Lottery.Backend.Entities;

namespace Lottery.Backend.Data;

/// <summary>
/// 抽奖系统数据库上下文
/// </summary>
public class LotteryDbContext : DbContext
{
    public LotteryDbContext(DbContextOptions<LotteryDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// 活动表
    /// </summary>
    public DbSet<Activity> Activities { get; set; }

    /// <summary>
    /// 奖品表
    /// </summary>
    public DbSet<Prize> Prizes { get; set; }

    /// <summary>
    /// 参与者表
    /// </summary>
    public DbSet<Participant> Participants { get; set; }

    /// <summary>
    /// 中奖记录表
    /// </summary>
    public DbSet<WinnerRecord> WinnerRecords { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 配置活动实体
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ThemeType).HasDefaultValue("wheel");
            entity.Property(e => e.Status).HasDefaultValue(0);
        });

        // 配置奖品实体
        modelBuilder.Entity<Prize>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Activity)
                  .WithMany(a => a.Prizes)
                  .HasForeignKey(e => e.ActivityId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 配置参与者实体
        modelBuilder.Entity<Participant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasOne(e => e.Activity)
                  .WithMany(a => a.Participants)
                  .HasForeignKey(e => e.ActivityId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // 配置中奖记录实体
        modelBuilder.Entity<WinnerRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.Activity)
                  .WithMany(a => a.WinnerRecords)
                  .HasForeignKey(e => e.ActivityId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Participant)
                  .WithMany(p => p.WinnerRecords)
                  .HasForeignKey(e => e.ParticipantId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Prize)
                  .WithMany(p => p.WinnerRecords)
                  .HasForeignKey(e => e.PrizeId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
