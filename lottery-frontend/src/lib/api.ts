// API 基础配置和封装
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// 通用错误处理
interface ApiError {
  message: string;
  status: number;
}

// 封装 fetch 请求
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: await response.text(),
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

// 活动相关类型
export interface Activity {
  id: number;
  name: string;
  description?: string;
  themeType: string;
  status: number;
  createdAt: string;
  prizes?: Prize[];
  participants?: Participant[];
}

// 奖品类型
export interface Prize {
  id: number;
  activityId: number;
  name: string;
  level: number;
  quantity: number;
  remainingQuantity: number;
  imageUrl?: string;
}

// 参与者类型
export interface Participant {
  id: number;
  activityId: number;
  name: string;
  code?: string;
  department?: string;
  isWinner: boolean;
}

// 中奖记录类型
export interface WinnerRecord {
  id: number;
  activityId: number;
  participantId: number;
  prizeId: number;
  wonAt: string;
  round: number;
  participant?: Participant;
  prize?: Prize;
}

// 抽奖请求类型
export interface DrawRequest {
  activityId: number;
  prizeId: number;
  count: number;
  round: number;
}

// 抽奖结果类型
export interface DrawResult {
  winners: {
    id: number;
    name: string;
    code?: string;
    department?: string;
  }[];
  prize: Prize;
}

// 活动统计类型
export interface ActivityStats {
  totalParticipants: number;
  availableParticipants: number;
  totalPrizes: number;
  remainingPrizes: number;
  totalWinners: number;
}

// ==================== 活动 API ====================

// 获取所有活动
export async function getActivities(): Promise<Activity[]> {
  return fetchApi<Activity[]>('/api/activities');
}

// 获取单个活动
export async function getActivity(id: number): Promise<Activity> {
  return fetchApi<Activity>(`/api/activities/${id}`);
}

// 创建活动
export async function createActivity(activity: Partial<Activity>): Promise<Activity> {
  return fetchApi<Activity>('/api/activities', {
    method: 'POST',
    body: JSON.stringify(activity),
  });
}

// 更新活动
export async function updateActivity(id: number, activity: Partial<Activity>): Promise<void> {
  return fetchApi<void>(`/api/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...activity, id }),
  });
}

// 删除活动
export async function deleteActivity(id: number): Promise<void> {
  return fetchApi<void>(`/api/activities/${id}`, {
    method: 'DELETE',
  });
}

// ==================== 奖品 API ====================

// 获取活动奖品
export async function getPrizes(activityId: number): Promise<Prize[]> {
  return fetchApi<Prize[]>(`/api/activities/${activityId}/prizes`);
}

// 添加奖品
export async function createPrize(activityId: number, prize: Partial<Prize>): Promise<Prize> {
  return fetchApi<Prize>(`/api/activities/${activityId}/prizes`, {
    method: 'POST',
    body: JSON.stringify(prize),
  });
}

// 删除奖品
export async function deletePrize(activityId: number, prizeId: number): Promise<void> {
  return fetchApi<void>(`/api/activities/${activityId}/prizes/${prizeId}`, {
    method: 'DELETE',
  });
}

// ==================== 参与者 API ====================

// 获取参与者列表
export async function getParticipants(activityId: number): Promise<Participant[]> {
  return fetchApi<Participant[]>(`/api/activities/${activityId}/participants`);
}

// 获取可抽奖参与者
export async function getAvailableParticipants(activityId: number): Promise<Participant[]> {
  return fetchApi<Participant[]>(`/api/activities/${activityId}/participants/available`);
}

// 批量导入参与者
export async function importParticipants(activityId: number, participants: Partial<Participant>[]): Promise<{ imported: number }> {
  return fetchApi<{ imported: number }>(`/api/activities/${activityId}/participants/import`, {
    method: 'POST',
    body: JSON.stringify(participants),
  });
}

// 清空参与者
export async function clearParticipants(activityId: number): Promise<{ deleted: number }> {
  return fetchApi<{ deleted: number }>(`/api/activities/${activityId}/participants`, {
    method: 'DELETE',
  });
}

// ==================== 抽奖 API ====================

// 执行抽奖
export async function draw(request: DrawRequest): Promise<DrawResult> {
  return fetchApi<DrawResult>('/api/lottery/draw', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// 获取中奖记录
export async function getWinners(activityId: number): Promise<WinnerRecord[]> {
  return fetchApi<WinnerRecord[]>(`/api/lottery/winners/${activityId}`);
}

// 重置抽奖
export async function resetLottery(activityId: number): Promise<{ message: string }> {
  return fetchApi<{ message: string }>(`/api/lottery/reset/${activityId}`, {
    method: 'POST',
  });
}

// 获取活动统计
export async function getActivityStats(activityId: number): Promise<ActivityStats> {
  return fetchApi<ActivityStats>(`/api/lottery/stats/${activityId}`);
}
