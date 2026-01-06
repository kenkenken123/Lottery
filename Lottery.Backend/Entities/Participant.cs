using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Lottery.Backend.Entities;

/// <summary>
/// 参与者实体
/// </summary>
public class Participant
{
    /// <summary>
    /// 参与者ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 关联的活动ID
    /// </summary>
    public int ActivityId { get; set; }

    /// <summary>
    /// 参与者姓名
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 参与者编号/工号
    /// </summary>
    [MaxLength(50)]
    public string? Code { get; set; }

    /// <summary>
    /// 部门
    /// </summary>
    [MaxLength(100)]
    public string? Department { get; set; }

    /// <summary>
    /// 是否已中奖
    /// </summary>
    public bool IsWinner { get; set; } = false;

    /// <summary>
    /// 关联的活动
    /// </summary>
    [JsonIgnore]
    [ForeignKey("ActivityId")]
    public Activity? Activity { get; set; }

    /// <summary>
    /// 该参与者的中奖记录
    /// </summary>
    public List<WinnerRecord> WinnerRecords { get; set; } = new();
}
