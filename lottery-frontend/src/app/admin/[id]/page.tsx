'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    getActivity,
    getParticipants,
    getPrizes,
    getWinners,
    createPrize,
    deletePrize,
    importParticipants,
    clearParticipants,
    resetLottery,
    Activity,
    Participant,
    Prize,
    WinnerRecord,
} from '@/lib/api';

/**
 * 活动管理页面 - Professional Management Dashboard
 */
export default function AdminPage() {
    const params = useParams();
    const activityId = Number(params.id);

    const [activity, setActivity] = useState<Activity | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [winners, setWinners] = useState<WinnerRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'participants' | 'prizes' | 'winners'>('participants');
    const [loading, setLoading] = useState(true);

    // 添加奖品表单
    const [showPrizeForm, setShowPrizeForm] = useState(false);
    const [newPrize, setNewPrize] = useState({
        name: '',
        level: 1,
        quantity: 1,
    });

    // 批量导入
    const [importText, setImportText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 加载数据
    useEffect(() => {
        loadData();
    }, [activityId]);

    const loadData = async () => {
        try {
            const [activityData, participantsData, prizesData, winnersData] = await Promise.all([
                getActivity(activityId),
                getParticipants(activityId),
                getPrizes(activityId),
                getWinners(activityId),
            ]);

            setActivity(activityData);
            setParticipants(participantsData);
            setPrizes(prizesData);
            setWinners(winnersData);
        } catch (error) {
            console.error('加载数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 添加奖品
    const handleAddPrize = async () => {
        if (!newPrize.name.trim()) return;

        try {
            await createPrize(activityId, newPrize);
            setShowPrizeForm(false);
            setNewPrize({ name: '', level: 1, quantity: 1 });
            loadData();
        } catch (error) {
            console.error('添加奖品失败:', error);
        }
    };

    // 删除奖品
    const handleDeletePrize = async (prizeId: number) => {
        if (!confirm('确定要删除这个奖品吗？')) return;

        try {
            await deletePrize(activityId, prizeId);
            loadData();
        } catch (error) {
            console.error('删除奖品失败:', error);
        }
    };

    // 批量导入参与者（从文本）
    const handleImportFromText = async () => {
        if (!importText.trim()) return;

        const lines = importText.trim().split('\n');
        const newParticipants = lines.map(line => {
            const parts = line.split(/[,\t，]/);
            return {
                name: parts[0]?.trim() || '',
                code: parts[1]?.trim() || '',
                department: parts[2]?.trim() || '',
            };
        }).filter(p => p.name);

        if (newParticipants.length === 0) {
            alert('没有有效的参与者数据');
            return;
        }

        try {
            const result = await importParticipants(activityId, newParticipants);
            alert(`成功导入 ${result.imported} 名参与者`);
            setImportText('');
            loadData();
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败');
        }
    };

    // 一键生成测试参与者
    const handleGenerateTestData = async () => {
        const departments = ['技术部', '市场部', '设计部', '运营部', '人力资源'];
        const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
        const names = ['伟', '芳', '娜', '敏', '静', '秀', '强', '军', '杰', '磊', '洋', '勇', '艳', '丽'];

        const fakeData = Array.from({ length: 50 }).map((_, i) => {
            const surname = surnames[Math.floor(Math.random() * surnames.length)];
            const name = names[Math.floor(Math.random() * names.length)];
            const dept = departments[Math.floor(Math.random() * departments.length)];
            return {
                name: `${surname}${name}`,
                code: `TEST${String(Date.now()).slice(-4)}${String(i + 1).padStart(3, '0')}`,
                department: dept
            };
        });

        try {
            // 直接复用导入接口
            const result = await importParticipants(activityId, fakeData);
            alert(`🎉 成功生成并导入 ${result.imported} 条测试数据！`);
            loadData();
        } catch (error) {
            console.error('生成数据失败:', error);
            alert('生成失败，请检查控制台');
        }
    };

    // 一键生成测试奖品
    const handleGenerateTestPrizes = async () => {
        if (!confirm('确定要一键生成测试奖品吗？这会添加一系列标准奖品。')) return;

        const testPrizes = [
            { name: '特等奖：神秘大奖', level: 1, quantity: 1 },
            { name: '一等奖：最新款手机', level: 2, quantity: 3 },
            { name: '二等奖：平板电脑', level: 3, quantity: 5 },
            { name: '三等奖：智能手表', level: 4, quantity: 10 },
            { name: '四等奖：移动电源', level: 5, quantity: 20 },
            { name: '五等奖：定制水杯', level: 6, quantity: 50 },
        ];

        try {
            // 串行创建以确保顺序和稳定性
            for (const prize of testPrizes) {
                await createPrize(activityId, prize);
            }
            alert(`🎉 成功添加了 ${testPrizes.length} 种测试奖品！`);
            loadData();
        } catch (error) {
            console.error('生成奖品失败:', error);
            alert('生成失败，请检查控制台');
        }
    };

    // 从文件导入
    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        setImportText(text);
    };

    // 清空参与者
    const handleClearParticipants = async () => {
        if (!confirm('确定要清空所有参与者吗？此操作不可恢复！')) return;

        try {
            await clearParticipants(activityId);
            loadData();
        } catch (error) {
            console.error('清空失败:', error);
        }
    };

    // 重置抽奖
    const handleResetLottery = async () => {
        if (!confirm('确定要重置抽奖结果吗？所有中奖记录将被清除！')) return;

        try {
            await resetLottery(activityId);
            loadData();
        } catch (error) {
            console.error('重置失败:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                    <p className="mt-6 text-white font-bold text-lg drop-shadow-lg">🎉 加载中...</p>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-10 shadow-2xl text-center max-w-md w-full transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-6 animate-bounce">😢</div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">未找到活动</h2>
                    <p className="text-gray-600 mb-8">无法找到请求的活动数据。</p>
                    <Link href="/" className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105">
                        🏠 返回首页
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 font-sans">
            {/* Top Navigation Bar - Fun & Colorful */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b-4 border-white/50 shadow-xl">
                <div className="max-w-7xl mx-auto px-6 h-24 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-110 hover:rotate-12 shadow-lg"
                            title="返回列表"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent tracking-tight">🎊 {activity.name}</h1>
                            <div className="flex items-center gap-2 text-sm text-purple-600 font-bold mt-1">
                                <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" />
                                进行中
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href={`/lottery/${activityId}`}
                            className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl hover:from-orange-600 hover:to-pink-600 shadow-xl hover:shadow-2xl transition-all duration-300 font-black text-lg transform hover:scale-105"
                        >
                            <svg className="w-6 h-6 group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            🎯 开启抽奖
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* Dashboard Stats / Hero Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Stat Card 1 - Playful Blue */}
                    <div className="bg-gradient-to-br from-blue-400 to-cyan-400 p-8 rounded-3xl shadow-2xl border-4 border-white/50 flex items-center justify-between transform hover:scale-105 transition-all hover:shadow-blue-300/50">
                        <div>
                            <p className="text-sm font-black text-white/90 uppercase tracking-wider">👥 参与人数</p>
                            <p className="text-5xl font-black text-white mt-2 drop-shadow-lg">{participants.length}</p>
                        </div>
                        <div className="text-6xl animate-bounce">🎭</div>
                    </div>
                    {/* Stat Card 2 - Playful Orange */}
                    <div className="bg-gradient-to-br from-orange-400 to-pink-400 p-8 rounded-3xl shadow-2xl border-4 border-white/50 flex items-center justify-between transform hover:scale-105 transition-all hover:shadow-pink-300/50">
                        <div>
                            <p className="text-sm font-black text-white/90 uppercase tracking-wider">🎁 奖品数</p>
                            <p className="text-5xl font-black text-white mt-2 drop-shadow-lg">{prizes.length}</p>
                        </div>
                        <div className="text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎪</div>
                    </div>
                    {/* Stat Card 3 - Playful Purple */}
                    <div className="bg-gradient-to-br from-purple-400 to-pink-500 p-8 rounded-3xl shadow-2xl border-4 border-white/50 flex items-center justify-between transform hover:scale-105 transition-all hover:shadow-purple-300/50">
                        <div>
                            <p className="text-sm font-black text-white/90 uppercase tracking-wider">🏆 已中奖</p>
                            <p className="text-5xl font-black text-white mt-2 drop-shadow-lg">{winners.length}</p>
                        </div>
                        <div className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</div>
                    </div>
                </div>

                {/* Main Interaction Area - Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar / Tabs - Fun Style */}
                    <nav className="lg:col-span-1 space-y-4">
                        {(['participants', 'prizes', 'winners'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full flex items-center gap-4 px-6 py-6 rounded-2xl transition-all duration-300 text-left font-bold transform hover:scale-105 ${activeTab === tab
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-300/50 scale-105'
                                    : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-xl border-2 border-white/50'
                                    }`}
                            >
                                <span className="text-3xl">
                                    {tab === 'participants' && '👥'}
                                    {tab === 'prizes' && '🎁'}
                                    {tab === 'winners' && '🏆'}
                                </span>
                                <div>
                                    <div className="leading-tight text-lg">
                                        {tab === 'participants' && '参与人员'}
                                        {tab === 'prizes' && '奖品设置'}
                                        {tab === 'winners' && '中奖记录'}
                                    </div>
                                    <div className={`text-xs mt-1 ${activeTab === tab ? 'text-white/80' : 'text-gray-500'}`}>
                                        {tab === 'participants' && '管理参与者'}
                                        {tab === 'prizes' && '配置奖品池'}
                                        {tab === 'winners' && '查看结果'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </nav>

                    {/* Content Panel */}
                    <div className="lg:col-span-3">
                        {/* Participants Panel */}
                        {activeTab === 'participants' && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-white/50 overflow-hidden">
                                <div className="p-8 border-b-4 border-purple-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50">
                                    <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">👥 参与人员管理</h3>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleGenerateTestData}
                                            className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-400 text-white rounded-2xl text-sm font-black hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                                        >
                                            ⚡ 一键生成 (50人)
                                        </button>
                                        <button
                                            onClick={handleClearParticipants}
                                            className="px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-2xl text-sm font-black hover:from-rose-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                        >
                                            🗑️ 清空全部
                                        </button>
                                    </div>
                                </div>
                                <div className="p-8">
                                    {/* Import Box */}
                                    <div className="mb-8 p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-4 border-white/50 shadow-lg">
                                        <label className="block text-base font-black text-purple-700 mb-3">📥 批量导入</label>
                                        <textarea
                                            value={importText}
                                            onChange={(e) => setImportText(e.target.value)}
                                            className="w-full h-40 p-5 bg-white border-4 border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-300 focus:border-purple-400 transition-all font-mono text-sm text-gray-700 placeholder:text-gray-400 shadow-inner"
                                            placeholder={`格式: 姓名,编号,部门\n例如:\n张三,001,技术部\n李四,002,人事部`}
                                        />
                                        <div className="flex gap-4 mt-5">
                                            <button
                                                onClick={handleImportFromText}
                                                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all font-black text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                                            >
                                                🚀 导入数据
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-8 py-3 bg-white border-4 border-purple-200 text-purple-600 rounded-2xl hover:bg-purple-50 transition-all font-black text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                                            >
                                                📁 上传文件
                                            </button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".txt,.csv"
                                                onChange={handleFileImport}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <div className="overflow-hidden rounded-xl border border-slate-200">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                                <tr>
                                                    <th className="px-6 py-4">#</th>
                                                    <th className="px-6 py-4">姓名</th>
                                                    <th className="px-6 py-4">编号</th>
                                                    <th className="px-6 py-4">部门</th>
                                                    <th className="px-6 py-4">状态</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {participants.map((p, index) => (
                                                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-3 text-slate-400 text-sm font-mono">{String(index + 1).padStart(3, '0')}</td>
                                                        <td className="px-6 py-3 text-slate-800 font-medium">{p.name}</td>
                                                        <td className="px-6 py-3 text-slate-500 text-sm">{p.code || '-'}</td>
                                                        <td className="px-6 py-3 text-slate-500 text-sm">
                                                            <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-500">
                                                                {p.department || '通用'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            {p.isWinner ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                    已中奖
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    待抽奖
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {participants.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                                            <div className="flex flex-col items-center">
                                                                <div className="text-4xl mb-2">📂</div>
                                                                <p>暂无参与者数据。</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Prizes Panel */}
                        {activeTab === 'prizes' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                {/* Form */}
                                <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-white/50 p-8">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-2xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">🎁 奖品设置</h3>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleGenerateTestPrizes}
                                                className="px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-400 text-white rounded-2xl text-sm font-black hover:from-orange-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                                            >
                                                🎁 一键生成奖品
                                            </button>
                                            <button
                                                onClick={() => setShowPrizeForm(!showPrizeForm)}
                                                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl text-sm font-black hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                            >
                                                {showPrizeForm ? '❌ 取消' : '✨ 添加奖品'}
                                            </button>
                                        </div>
                                    </div>

                                    {showPrizeForm && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-gradient-to-br from-orange-50 to-pink-50 p-8 rounded-2xl border-4 border-white/50 mb-8 shadow-lg">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-black text-orange-700 uppercase tracking-wider mb-2">🏆 奖品名称</label>
                                                <input
                                                    type="text"
                                                    value={newPrize.name}
                                                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                                                    className="w-full px-5 py-3 border-4 border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-orange-400 font-bold shadow-inner"
                                                    placeholder="例如：华为 Mate 60 Pro"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-black text-orange-700 uppercase tracking-wider mb-2">🎯 等级</label>
                                                <select
                                                    value={newPrize.level}
                                                    onChange={(e) => setNewPrize({ ...newPrize, level: parseInt(e.target.value) })}
                                                    className="w-full px-5 py-3 border-4 border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-orange-400 font-bold shadow-inner"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <option key={i} value={i}>{i}等奖</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-black text-orange-700 uppercase tracking-wider mb-2">🔢 数量</label>
                                                <input
                                                    type="number"
                                                    value={newPrize.quantity}
                                                    onChange={(e) => setNewPrize({ ...newPrize, quantity: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-5 py-3 border-4 border-orange-200 rounded-2xl focus:ring-4 focus:ring-orange-300 focus:border-orange-400 font-bold shadow-inner"
                                                    min={1}
                                                />
                                            </div>
                                            <div className="md:col-span-4 flex justify-end">
                                                <button
                                                    onClick={handleAddPrize}
                                                    className="px-10 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-2xl hover:from-orange-600 hover:to-pink-600 transition-all font-black text-base shadow-xl hover:shadow-2xl transform hover:scale-105"
                                                >
                                                    🚀 保存奖品
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {prizes.map((prize) => (
                                            <div
                                                key={prize.id}
                                                className="group relative bg-gradient-to-br from-white to-orange-50 p-8 rounded-2xl border-4 border-white/50 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg
                                                            ${prize.level === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white' :
                                                                prize.level === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                                                                    prize.level === 3 ? 'bg-gradient-to-br from-orange-400 to-red-400 text-white' : 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'}`}>
                                                            {prize.level}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-gray-800 text-lg">{prize.name}</h4>
                                                            <div className="text-sm text-orange-600 font-bold tracking-wide">{prize.level}等奖</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeletePrize(prize.id)}
                                                        className="text-white bg-gradient-to-r from-rose-500 to-pink-500 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-xl shadow-rose-500/50 font-bold text-xl"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div className="mt-8 flex items-center justify-between">
                                                    <div className="text-sm font-black text-orange-600 uppercase">🎯 剩余库存</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-3xl font-black ${prize.remainingQuantity === 0 ? 'text-gray-300' : 'bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent'}`}>
                                                            {prize.remainingQuantity}
                                                        </span>
                                                        <span className="text-gray-500 text-base font-bold">/ {prize.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full rounded-full ${prize.remainingQuantity === 0 ? 'bg-gray-300' : 'bg-gradient-to-r from-orange-400 to-pink-400'}`}
                                                        style={{ width: `${(prize.remainingQuantity / prize.quantity) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Winners Panel */}
                        {activeTab === 'winners' && (
                            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-white/50 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                                <div className="p-8 border-b-4 border-purple-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50">
                                    <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🏆 中奖记录</h3>
                                    <button
                                        onClick={handleResetLottery}
                                        className="px-6 py-3 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-2xl text-sm font-black hover:from-rose-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                    >
                                        🔄 重置所有记录
                                    </button>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-sm uppercase tracking-wider font-black">
                                        <tr>
                                            <th className="px-8 py-5">🔢 轮次</th>
                                            <th className="px-8 py-5">🎭 中奖者</th>
                                            <th className="px-8 py-5">🎁 奖品</th>
                                            <th className="px-8 py-5">⏰ 时间</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y-2 divide-purple-100 bg-white">
                                        {winners.map((w) => (
                                            <tr key={w.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all">
                                                <td className="px-8 py-4 text-purple-600 text-base font-bold">第 {w.round} 轮</td>
                                                <td className="px-8 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg font-black shadow-lg">
                                                            {w.participant?.name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-800 font-black text-base">{w.participant?.name}</div>
                                                            <div className="text-sm text-purple-500 font-bold">{w.participant?.department}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-4">
                                                    <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg">
                                                        🏆 {w.prize?.name}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-gray-600 text-sm font-bold font-mono">
                                                    {new Date(w.wonAt).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
