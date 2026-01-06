using System.ComponentModel.DataAnnotations;

namespace Lottery.Backend.Entities;

/// <summary>
/// 抽奖活动实体
/// </summary>
public class Activity
{
    /// <summary>
    /// 活动ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 活动名称
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 活动描述
    /// </summary>
    [MaxLength(500)]
    public string? Description { get; set; }

    /// <summary>
    /// 抽奖界面主题类型 (wheel: 转盘, sphere: 3D球体)
    /// </summary>
    [MaxLength(50)]
    public string ThemeType { get; set; } = "wheel";

    /// <summary>
    /// 活动状态 (0: 未开始, 1: 进行中, 2: 已结束)
    /// </summary>
    public int Status { get; set; } = 0;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    /// <summary>
    /// 活动关联的奖品列表
    /// </summary>
    public List<Prize> Prizes { get; set; } = new();

    /// <summary>
    /// 活动关联的参与者列表
    /// </summary>
    public List<Participant> Participants { get; set; } = new();

    /// <summary>
    /// 活动关联的中奖记录列表
    /// </summary>
    public List<WinnerRecord> WinnerRecords { get; set; } = new();
}
