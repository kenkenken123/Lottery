using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Lottery.Backend.Data;
using Lottery.Backend.Entities;

namespace Lottery.Backend.Controllers;

/// <summary>
/// 参与者管理控制器
/// </summary>
[ApiController]
[Route("api/activities/{activityId}/[controller]")]
public class ParticipantsController : ControllerBase
{
    private readonly LotteryDbContext _context;

    public ParticipantsController(LotteryDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// 获取活动的所有参与者
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Participant>>> GetParticipants(int activityId)
    {
        return await _context.Participants
            .Where(p => p.ActivityId == activityId)
            .OrderBy(p => p.Code)
            .ToListAsync();
    }

    /// <summary>
    /// 获取未中奖的参与者
    /// </summary>
    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<Participant>>> GetAvailableParticipants(int activityId)
    {
        return await _context.Participants
            .Where(p => p.ActivityId == activityId && !p.IsWinner)
            .OrderBy(p => p.Code)
            .ToListAsync();
    }

    /// <summary>
    /// 获取单个参与者
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Participant>> GetParticipant(int activityId, int id)
    {
        var participant = await _context.Participants
            .FirstOrDefaultAsync(p => p.ActivityId == activityId && p.Id == id);

        if (participant == null)
        {
            return NotFound();
        }

        return participant;
    }

    /// <summary>
    /// 添加参与者
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Participant>> CreateParticipant(int activityId, Participant participant)
    {
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null)
        {
            return NotFound("活动不存在");
        }

        participant.ActivityId = activityId;
        participant.IsWinner = false;
        _context.Participants.Add(participant);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetParticipant), new { activityId, id = participant.Id }, participant);
    }

    /// <summary>
    /// 批量导入参与者
    /// </summary>
    [HttpPost("import")]
    public async Task<ActionResult<int>> ImportParticipants(int activityId, List<Participant> participants)
    {
        var activity = await _context.Activities.FindAsync(activityId);
        if (activity == null)
        {
            return NotFound("活动不存在");
        }

        foreach (var participant in participants)
        {
            participant.ActivityId = activityId;
            participant.IsWinner = false;
        }

        _context.Participants.AddRange(participants);
        await _context.SaveChangesAsync();

        return Ok(new { imported = participants.Count });
    }

    /// <summary>
    /// 删除参与者
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteParticipant(int activityId, int id)
    {
        var participant = await _context.Participants
            .FirstOrDefaultAsync(p => p.ActivityId == activityId && p.Id == id);

        if (participant == null)
        {
            return NotFound();
        }

        _context.Participants.Remove(participant);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// 清空活动的所有参与者
    /// </summary>
    [HttpDelete]
    public async Task<IActionResult> ClearParticipants(int activityId)
    {
        var participants = await _context.Participants
            .Where(p => p.ActivityId == activityId)
            .ToListAsync();

        _context.Participants.RemoveRange(participants);
        await _context.SaveChangesAsync();

        return Ok(new { deleted = participants.Count });
    }
}
