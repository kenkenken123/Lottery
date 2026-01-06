'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActivities, Activity, deleteActivity, createActivity } from '@/lib/api';

/**
 * 首页 - 活动列表
 */
export default function HomePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    themeType: 'wheel',
  });

  // 加载活动列表
  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建活动
  const handleCreate = async () => {
    if (!newActivity.name.trim()) return;

    try {
      await createActivity(newActivity);
      setShowCreateModal(false);
      setNewActivity({ name: '', description: '', themeType: 'wheel' });
      loadActivities();
    } catch (error) {
      console.error('创建活动失败:', error);
    }
  };

  // 删除活动
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个活动吗？')) return;

    try {
      await deleteActivity(id);
      loadActivities();
    } catch (error) {
      console.error('删除活动失败:', error);
    }
  };

  // 主题类型显示名称
  const getThemeLabel = (type: string) => {
    const labels: Record<string, string> = {
      wheel: '🎡 经典转盘',
      sphere: '🌐 3D球体',
    };
    return labels[type] || type;
  };

  // 状态显示
  const getStatusBadge = (status: number) => {
    const badges = [
      { label: '未开始', class: 'bg-gray-500' },
      { label: '进行中', class: 'bg-green-500' },
      { label: '已结束', class: 'bg-red-500' },
    ];
    const badge = badges[status] || badges[0];
    return (
      <span className={`${badge.class} text-white px-2 py-1 rounded-full text-xs`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* 头部 */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-white">🎰 抽奖系统</h1>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-6 py-8">
        {/* 操作栏 */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-white">活动列表</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl
                       font-semibold hover:from-pink-600 hover:to-purple-700 transition-all
                       shadow-lg hover:shadow-xl"
          >
            ➕ 创建活动
          </button>
        </div>

        {/* 加载中 */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            <p className="text-white mt-4">加载中...</p>
          </div>
        )}

        {/* 空状态 */}
        {!loading && activities.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎲</div>
            <p className="text-white/60 text-xl">还没有活动，创建一个吧！</p>
          </div>
        )}

        {/* 活动卡片列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20
                         hover:bg-white/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-white">{activity.name}</h3>
                {getStatusBadge(activity.status)}
              </div>

              <p className="text-white/60 mb-4 line-clamp-2">
                {activity.description || '暂无描述'}
              </p>

              <div className="mb-4">
                <span className="text-sm text-white/40">抽奖主题：</span>
                <span className="text-white ml-2">{getThemeLabel(activity.themeType)}</span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/lottery/${activity.id}`}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2
                             rounded-lg text-center font-medium hover:from-green-600 hover:to-emerald-700
                             transition-all"
                >
                  🎯 开始抽奖
                </Link>
                <Link
                  href={`/admin/${activity.id}`}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
                >
                  ⚙️
                </Link>
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-all"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 创建活动弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">创建新活动</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="例如：2024年会抽奖"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动描述</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="活动描述（可选）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">抽奖主题</label>
                <select
                  value={newActivity.themeType}
                  onChange={(e) => setNewActivity({ ...newActivity, themeType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="wheel">🎡 经典转盘</option>
                  <option value="sphere">🌐 3D球体</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newActivity.name.trim()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2
                           rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
