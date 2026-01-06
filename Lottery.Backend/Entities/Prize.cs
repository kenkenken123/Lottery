using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Lottery.Backend.Entities;

/// <summary>
/// 奖品实体
/// </summary>
public class Prize
{
    /// <summary>
    /// 奖品ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 关联的活动ID
    /// </summary>
    public int ActivityId { get; set; }

    /// <summary>
    /// 奖品名称
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 奖品等级 (1: 一等奖, 2: 二等奖, 3: 三等奖...)
    /// </summary>
    public int Level { get; set; } = 1;

    /// <summary>
    /// 奖品总数量
    /// </summary>
    public int Quantity { get; set; } = 1;

    /// <summary>
    /// 剩余数量
    /// </summary>
    public int RemainingQuantity { get; set; } = 1;

    /// <summary>
    /// 奖品图片URL
    /// </summary>
    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    /// <summary>
    /// 关联的活动
    /// </summary>
    [ForeignKey("ActivityId")]
    public Activity? Activity { get; set; }

    /// <summary>
    /// 该奖品的中奖记录
    /// </summary>
    public List<WinnerRecord> WinnerRecords { get; set; } = new();
}
