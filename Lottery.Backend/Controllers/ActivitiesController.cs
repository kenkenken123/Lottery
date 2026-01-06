using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lottery.Backend.Data;
using Lottery.Backend.Entities;

namespace Lottery.Backend.Controllers;

/// <summary>
/// 活动管理控制器
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly LotteryDbContext _context;

    public ActivitiesController(LotteryDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// 获取所有活动
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Activity>>> GetActivities()
    {
        return await _context.Activities
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// 获取单个活动详情
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Activity>> GetActivity(int id)
    {
        var activity = await _context.Activities
            .Include(a => a.Prizes)
            .Include(a => a.Participants)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (activity == null)
        {
            return NotFound();
        }

        return activity;
    }

    /// <summary>
    /// 创建新活动
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Activity>> CreateActivity(Activity activity)
    {
        activity.CreatedAt = DateTime.Now;
        _context.Activities.Add(activity);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetActivity), new { id = activity.Id }, activity);
    }

    /// <summary>
    /// 更新活动
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateActivity(int id, Activity activity)
    {
        if (id != activity.Id)
        {
            return BadRequest();
        }

        _context.Entry(activity).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ActivityExists(id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    /// <summary>
    /// 删除活动
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteActivity(int id)
    {
        var activity = await _context.Activities.FindAsync(id);
        if (activity == null)
        {
            return NotFound();
        }

        _context.Activities.Remove(activity);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ActivityExists(int id)
    {
        return _context.Activities.Any(e => e.Id == id);
    }
}
