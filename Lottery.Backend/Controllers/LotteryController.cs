using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lottery.Backend.Data;
using Lottery.Backend.Entities;

namespace Lottery.Backend.Controllers;

/// <summary>
/// 抽奖DTO
/// </summary>
public class DrawRequest
{
    /// <summary>
    /// 活动ID
    /// </summary>
    public int ActivityId { get; set; }

    /// <summary>
    /// 奖品ID
    /// </summary>
    public int PrizeId { get; set; }

    /// <summary>
    /// 抽取数量
    /// </summary>
    public int Count { get; set; } = 1;

    /// <summary>
    /// 抽奖轮次
    /// </summary>
    public int Round { get; set; } = 1;
}

/// <summary>
/// 抽奖结果DTO
/// </summary>
public class DrawResult
{
    /// <summary>
    /// 中奖者列表
    /// </summary>
    public List<WinnerInfo> Winners { get; set; } = new();

    /// <summary>
    /// 奖品信息
    /// </summary>
    public Prize? Prize { get; set; }
}

/// <summary>
/// 中奖者信息
/// </summary>
public class WinnerInfo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Department { get; set; }
}

/// <summary>
/// 抽奖控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class LotteryController : ControllerBase
{
    private readonly LotteryDbContext _context;
    private readonly Random _random = new();

    public LotteryController(LotteryDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// 执行抽奖
    /// </summary>
    [HttpPost("draw")]
    public async Task<ActionResult<DrawResult>> Draw(DrawRequest request)
    {
        // 验证活动
        var activity = await _context.Activities.FindAsync(request.ActivityId);
        if (activity == null)
        {
            return NotFound("活动不存在");
        }

        // 验证奖品
        var prize = await _context.Prizes.FindAsync(request.PrizeId);
        if (prize == null || prize.ActivityId != request.ActivityId)
        {
            return NotFound("奖品不存在");
        }

        // 检查奖品剩余数量
        if (prize.RemainingQuantity < request.Count)
        {
            return BadRequest($"奖品剩余数量不足，当前剩余: {prize.RemainingQuantity}");
        }

        // 获取未中奖的参与者
        var availableParticipants = await _context.Participants
            .Where(p => p.ActivityId == request.ActivityId && !p.IsWinner)
            .ToListAsync();

        if (availableParticipants.Count < request.Count)
        {
            return BadRequest($"可抽奖人数不足，当前可抽奖人数: {availableParticipants.Count}");
        }

        // 随机抽取中奖者
        var winners = new List<Participant>();
        var shuffled = availableParticipants.OrderBy(x => _random.Next()).ToList();
        winners = shuffled.Take(request.Count).ToList();

        // 记录中奖信息
        foreach (var winner in winners)
        {
            winner.IsWinner = true;

            var record = new WinnerRecord
            {
                ActivityId = request.ActivityId,
                ParticipantId = winner.Id,
                PrizeId = request.PrizeId,
                WonAt = DateTime.Now,
                Round = request.Round
            };
            _context.WinnerRecords.Add(record);
        }

        // 更新奖品剩余数量
        prize.RemainingQuantity -= request.Count;

        await _context.SaveChangesAsync();

        // 返回结果
        var result = new DrawResult
        {
            Prize = prize,
            Winners = winners.Select(w => new WinnerInfo
            {
                Id = w.Id,
                Name = w.Name,
                Code = w.Code,
                Department = w.Department
            }).ToList()
        };

        return Ok(result);
    }

    /// <summary>
    /// 获取活动的中奖记录
    /// </summary>
    [HttpGet("winners/{activityId}")]
    public async Task<ActionResult<IEnumerable<WinnerRecord>>> GetWinners(int activityId)
    {
        var records = await _context.WinnerRecords
            .Include(r => r.Participant)
            .Include(r => r.Prize)
            .Where(r => r.ActivityId == activityId)
            .OrderByDescending(r => r.WonAt)
            .ToListAsync();

        return Ok(records);
    }

    /// <summary>
    /// 按轮次获取中奖记录
    /// </summary>
    [HttpGet("winners/{activityId}/round/{round}")]
    public async Task<ActionResult<IEnumerable<WinnerRecord>>> GetWinnersByRound(int activityId, int round)
    {
        var records = await _context.WinnerRecords
            .Include(r => r.Participant)
            .Include(r => r.Prize)
            .Where(r => r.ActivityId == activityId && r.Round == round)
            .ToListAsync();

        return Ok(records);
    }

    /// <summary>
    /// 重置活动抽奖结果
    /// </summary>
    [HttpPost("reset/{activityId}")]
    public async Task<IActionResult> ResetActivity(int activityId)
    {
        var activity = await _context.Activities
            .Include(a => a.Participants)
            .Include(a => a.Prizes)
            .Include(a => a.WinnerRecords)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null)
        {
            return NotFound("活动不存在");
        }

        // 重置所有参与者的中奖状态
        foreach (var participant in activity.Participants)
        {
            participant.IsWinner = false;
        }

        // 重置所有奖品的剩余数量
        foreach (var prize in activity.Prizes)
        {
            prize.RemainingQuantity = prize.Quantity;
        }

        // 删除所有中奖记录
        _context.WinnerRecords.RemoveRange(activity.WinnerRecords);

        await _context.SaveChangesAsync();

        return Ok(new { message = "抽奖结果已重置" });
    }

    /// <summary>
    /// 获取活动统计信息
    /// </summary>
    [HttpGet("stats/{activityId}")]
    public async Task<ActionResult<object>> GetStats(int activityId)
    {
        var activity = await _context.Activities
            .Include(a => a.Participants)
            .Include(a => a.Prizes)
            .Include(a => a.WinnerRecords)
            .FirstOrDefaultAsync(a => a.Id == activityId);

        if (activity == null)
        {
            return NotFound("活动不存在");
        }

        return Ok(new
        {
            totalParticipants = activity.Participants.Count,
            availableParticipants = activity.Participants.Count(p => !p.IsWinner),
            totalPrizes = activity.Prizes.Sum(p => p.Quantity),
            remainingPrizes = activity.Prizes.Sum(p => p.RemainingQuantity),
            totalWinners = activity.WinnerRecords.Count
        });
    }
}
