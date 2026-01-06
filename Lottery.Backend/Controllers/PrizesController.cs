using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lottery.Backend.Data;
using Lottery.Backend.Entities;

namespace Lottery.Backend.Controllers;

/// <summary>
/// 奖品管理控制器
/// </summary>
[ApiController]
[Route("api/activities/{activityId}/[controller]")]
public class PrizesController : ControllerBase
{
    private readonly LotteryDbContext _context;

    public PrizesController(LotteryDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// 获取活动的所有奖品
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Prize>>> GetPrizes(int activityId)
    {
        return await _context.Prizes
            .Where(p => p.ActivityId == activityId)
            .OrderBy(p => p.Level)
            .ToListAsync();
    }

    /// <summary>
    /// 获取单个奖品
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Prize>> GetPrize(int activityId, int id)
    {
        var prize = await _context.Prizes
            .FirstOrDefaultAsync(p => p.ActivityId == activityId && p.Id == id);

        if (prize == null)
        {
            return NotFound();
        }

        return prize;
    }

    /// <summary>
    /// 添加奖品
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Prize>> CreatePrize(int activityId, Prize prize)
    {
        // 验证活动是否存在
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null)
        {
            return NotFound("活动不存在");
        }

        prize.ActivityId = activityId;
        prize.RemainingQuantity = prize.Quantity;
        _context.Prizes.Add(prize);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPrize), new { activityId, id = prize.Id }, prize);
    }

    /// <summary>
    /// 更新奖品
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePrize(int activityId, int id, Prize prize)
    {
        if (id != prize.Id || activityId != prize.ActivityId)
        {
            return BadRequest();
        }

        _context.Entry(prize).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PrizeExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    /// <summary>
    /// 删除奖品
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePrize(int activityId, int id)
    {
        var prize = await _context.Prizes
            .FirstOrDefaultAsync(p => p.ActivityId == activityId && p.Id == id);

        if (prize == null)
        {
            return NotFound();
        }

        _context.Prizes.Remove(prize);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool PrizeExists(int id)
    {
        return _context.Prizes.Any(e => e.Id == id);
    }
}
