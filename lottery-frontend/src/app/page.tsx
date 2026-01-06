'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActivities, Activity, deleteActivity, createActivity } from '@/lib/api';

/**
 * 首页 - 活动列表 (Admin Style Redesign)
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
      wheel: '经典转盘 (3D)',
      sphere: '赛博球体 (3D)',
    };
    return labels[type] || type;
  };

  // 状态显示
  const getStatusBadge = (status: number) => {
    // 0: Draft/Not Started, 1: Active, 2: Finished
    if (status === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          进行中
        </span>
      );
    }
    if (status === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          已结束
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        未开始
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 font-sans">
      {/* 头部 - Fun & Colorful */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b-4 border-white/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/30 transform hover:scale-110 transition-transform">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent tracking-tight">🎉 企业抽奖管理系统</h1>
          </div>
          <div className="text-base font-black text-purple-600">
            🎆 Lottery System
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 操作栏 */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">🎪 活动列表</h2>
            <p className="text-purple-600 text-base font-bold">管理您的所有抽奖活动，实时监控状态。</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 shadow-2xl hover:shadow-purple-300/50 transition-all duration-300 font-black text-lg transform hover:scale-105"
          >
            <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            ✨ 创建新活动
          </button>
        </div>

        {/* 加载中 */}
        {loading && (
          <div className="flex flex-col items-center py-20">
            <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            <p className="mt-6 text-white font-bold text-lg drop-shadow-lg">🎉 加载数据中...</p>
          </div>
        )}

        {/* 空状态 */}
        {!loading && activities.length === 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-20 text-center border-4 border-dashed border-white/50 shadow-2xl">
            <div className="text-8xl mb-8 animate-bounce">
              🎲
            </div>
            <h3 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">暂无活动</h3>
            <p className="text-purple-600 font-bold mb-10 max-w-md mx-auto text-lg">还没有创建任何抽奖活动。点击右上角的按钮开始您的第一个活动吧！</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 text-lg"
            >
              🚀 立即创建
            </button>
          </div>
        )}

        {/* 活动卡片列表 - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border-4 border-white/50 shadow-2xl hover:shadow-purple-300/50 hover:-translate-y-2 transition-all duration-300 group flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 text-white flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 transition-transform">
                  {activity.themeType === 'wheel' ? '🎡' : '🌐'}
                </div>
                {getStatusBadge(activity.status)}
              </div>

              <h3 className="text-xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">{activity.name}</h3>

              <p className="text-purple-600 text-sm font-bold mb-8 line-clamp-2 min-h-[2.5em]">
                {activity.description || '暂无描述信息...'}
              </p>

              <div className="mt-auto">
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl text-xs font-black text-purple-700">
                    {getThemeLabel(activity.themeType)}
                  </span>
                  <span className="text-xs text-purple-500 font-bold">ID: {activity.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/lottery/${activity.id}`}
                    className="col-span-2 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-black rounded-2xl hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🎯 开始抽奖
                  </Link>
                  <Link
                    href={`/admin/${activity.id}`}
                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-black rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    ⚙️ 管理
                  </Link>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white text-sm font-black rounded-2xl hover:from-rose-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 创建活动弹窗 - Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateModal(false)} />

          <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-4 border-white/50">
            <div className="px-8 py-6 border-b-4 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 flex justify-between items-center">
              <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">✨ 创建新活动</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-purple-400 hover:text-purple-600 transition-colors transform hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-base font-black text-purple-700 mb-2">🎯 活动名称 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-4 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all text-sm outline-none placeholder:text-gray-400 font-bold shadow-inner"
                  placeholder="例如：2024 年度盛典抽奖"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-base font-black text-purple-700 mb-2">📝 活动描述</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-5 py-3 bg-white border-4 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all text-sm outline-none placeholder:text-gray-400 min-h-[100px] font-bold shadow-inner"
                  placeholder="简要描述活动的目的和规则..."
                />
              </div>

              <div>
                <label className="block text-base font-black text-purple-700 mb-3">🎨 视觉主题</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer border-4 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all transform hover:scale-105 ${newActivity.themeType === 'wheel' ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 ring-2 ring-purple-400 shadow-lg' : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'}`}>
                    <input
                      type="radio"
                      name="themeType"
                      value="wheel"
                      checked={newActivity.themeType === 'wheel'}
                      onChange={(e) => setNewActivity({ ...newActivity, themeType: e.target.value })}
                      className="hidden"
                    />
                    <span className="text-4xl">🎡</span>
                    <div className="text-center">
                      <div className="text-base font-black text-purple-800">经典转盘</div>
                      <div className="text-xs text-purple-600 font-bold">Pokemon 风格</div>
                    </div>
                  </label>

                  <label className={`cursor-pointer border-4 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all transform hover:scale-105 ${newActivity.themeType === 'sphere' ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 ring-2 ring-purple-400 shadow-lg' : 'border-purple-200 hover:border-purple-300 hover:bg-purple-50'}`}>
                    <input
                      type="radio"
                      name="themeType"
                      value="sphere"
                      checked={newActivity.themeType === 'sphere'}
                      onChange={(e) => setNewActivity({ ...newActivity, themeType: e.target.value })}
                      className="hidden"
                    />
                    <span className="text-4xl">🌐</span>
                    <div className="text-center">
                      <div className="text-base font-black text-purple-800">赛博球体</div>
                      <div className="text-xs text-purple-600 font-bold">黑客帝国风格</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-8 border-t-4 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 flex gap-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3.5 bg-white border-4 border-purple-200 text-purple-700 font-black rounded-2xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ❌ 取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newActivity.name.trim()}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                🚀 立即创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
