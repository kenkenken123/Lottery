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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* 头部 - Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">企业抽奖管理系统</h1>
          </div>
          <div className="text-sm font-medium text-slate-500">
            Professional Lottery System
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* 操作栏 */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">活动列表</h2>
            <p className="text-slate-500 text-sm">管理您的所有抽奖活动，实时监控状态。</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 font-medium"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            创建新活动
          </button>
        </div>

        {/* 加载中 */}
        {loading && (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
            <p className="mt-4 text-slate-500 font-medium">加载数据中...</p>
          </div>
        )}

        {/* 空状态 */}
        {!loading && activities.length === 0 && (
          <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-slate-300">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              🎲
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">暂无活动</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">还没有创建任何抽奖活动。点击右上角的按钮开始您的第一个活动吧！</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              立即创建
            </button>
          </div>
        )}

        {/* 活动卡片列表 - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl shadow-sm">
                  {activity.themeType === 'wheel' ? '🎡' : '🌐'}
                </div>
                {getStatusBadge(activity.status)}
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">{activity.name}</h3>

              <p className="text-slate-500 text-sm mb-6 line-clamp-2 min-h-[2.5em]">
                {activity.description || '暂无描述信息...'}
              </p>

              <div className="mt-auto">
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-500">
                    {getThemeLabel(activity.themeType)}
                  </span>
                  <span className="text-xs text-slate-400">ID: {activity.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={`/lottery/${activity.id}`}
                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    🎯 开始抽奖
                  </Link>
                  <Link
                    href={`/admin/${activity.id}`}
                    className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  >
                    ⚙️ 管理
                  </Link>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-rose-500 text-sm font-medium rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-colors"
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

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">创建新活动</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">活动名称 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm outline-none placeholder:text-slate-300"
                  placeholder="例如：2024 年度盛典抽奖"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">活动描述</label>
                <textarea
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm outline-none placeholder:text-slate-300 min-h-[100px]"
                  placeholder="简要描述活动的目的和规则..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">视觉主题</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${newActivity.themeType === 'wheel' ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="themeType"
                      value="wheel"
                      checked={newActivity.themeType === 'wheel'}
                      onChange={(e) => setNewActivity({ ...newActivity, themeType: e.target.value })}
                      className="hidden"
                    />
                    <span className="text-3xl">🎡</span>
                    <div className="text-center">
                      <div className="text-sm font-bold text-slate-800">经典转盘</div>
                      <div className="text-xs text-slate-400">Pokemon 风格</div>
                    </div>
                  </label>

                  <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${newActivity.themeType === 'sphere' ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                    <input
                      type="radio"
                      name="themeType"
                      value="sphere"
                      checked={newActivity.themeType === 'sphere'}
                      onChange={(e) => setNewActivity({ ...newActivity, themeType: e.target.value })}
                      className="hidden"
                    />
                    <span className="text-3xl">🌐</span>
                    <div className="text-center">
                      <div className="text-sm font-bold text-slate-800">赛博球体</div>
                      <div className="text-xs text-slate-400">黑客帝国风格</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newActivity.name.trim()}
                className="flex-1 px-4 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/10"
              >
                立即创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
