using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Lottery.Backend.Entities;

/// <summary>
/// 中奖记录实体
/// </summary>
public class WinnerRecord
{
    /// <summary>
    /// 记录ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 关联的活动ID
    /// </summary>
    public int ActivityId { get; set; }

    /// <summary>
    /// 中奖者ID
    /// </summary>
    public int ParticipantId { get; set; }

    /// <summary>
    /// 获得的奖品ID
    /// </summary>
    public int PrizeId { get; set; }

    /// <summary>
    /// 中奖时间
    /// </summary>
    public DateTime WonAt { get; set; } = DateTime.Now;

    /// <summary>
    /// 抽奖轮次
    /// </summary>
    public int Round { get; set; } = 1;

    /// <summary>
    /// 关联的活动
    /// </summary>
    [JsonIgnore]
    [ForeignKey("ActivityId")]
    public Activity? Activity { get; set; }

    /// <summary>
    /// 关联的参与者
    /// </summary>
    [ForeignKey("ParticipantId")]
    public Participant? Participant { get; set; }

    /// <summary>
    /// 关联的奖品
    /// </summary>
    [ForeignKey("PrizeId")]
    public Prize? Prize { get; set; }
}
