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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-teal-500 animate-spin" />
                    <p className="mt-4 text-slate-500 font-medium">数据加载中...</p>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
                    <div className="text-4xl mb-4">🚫</div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">未找到活动</h2>
                    <p className="text-slate-500 mb-6">无法找到请求的活动数据。</p>
                    <Link href="/" className="inline-block px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium">
                        返回首页
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* Top Navigation Bar - Glassmorphism */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all"
                            title="返回列表"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{activity.name}</h1>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-teal-500" />
                                进行中
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href={`/lottery/${activityId}`}
                            className="group flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-teal-600 hover:shadow-lg hover:shadow-teal-500/20 transition-all duration-300 font-medium"
                        >
                            <svg className="w-5 h-5 group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            开启抽奖
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-6 py-8">

                {/* Dashboard Stats / Hero Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Stat Card 1 */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">参与人数</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{participants.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                    </div>
                    {/* Stat Card 2 */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">奖品数</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{prizes.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                        </div>
                    </div>
                    {/* Stat Card 3 */}
                    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">已中奖人数</p>
                            <p className="text-3xl font-bold text-slate-800 mt-1">{winners.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Main Interaction Area - Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar / Tabs */}
                    <nav className="lg:col-span-1 space-y-2">
                        {(['participants', 'prizes', 'winners'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-200 text-left font-medium ${activeTab === tab
                                    ? 'bg-slate-800 text-white shadow-lg shadow-slate-300'
                                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent'
                                    }`}
                            >
                                <span className="text-xl">
                                    {tab === 'participants' && '👥'}
                                    {tab === 'prizes' && '🎁'}
                                    {tab === 'winners' && '🏆'}
                                </span>
                                <div>
                                    <div className="leading-tight capitalize">
                                        {tab === 'participants' && '参与人员'}
                                        {tab === 'prizes' && '奖品设置'}
                                        {tab === 'winners' && '中奖记录'}
                                    </div>
                                    <div className={`text-xs ${activeTab === tab ? 'text-slate-400' : 'text-slate-300'}`}>
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
                            <div className="bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-800">参与人员管理</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGenerateTestData}
                                            className="px-4 py-2 bg-white border border-slate-200 text-teal-600 rounded-lg text-sm font-medium hover:bg-teal-50 hover:border-teal-200 transition-colors flex items-center gap-2"
                                        >
                                            ⚡ 一键生成 (50人)
                                        </button>
                                        <button
                                            onClick={handleClearParticipants}
                                            className="px-4 py-2 bg-white border border-slate-200 text-rose-500 rounded-lg text-sm font-medium hover:bg-rose-50 hover:border-rose-200 transition-colors"
                                        >
                                            清空全部
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6">
                                    {/* Import Box */}
                                    <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">批量导入</label>
                                        <textarea
                                            value={importText}
                                            onChange={(e) => setImportText(e.target.value)}
                                            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono text-sm text-slate-600 placeholder:text-slate-300"
                                            placeholder={`格式: 姓名,编号,部门\n例如:\n张三,001,技术部\n李四,002,人事部`}
                                        />
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={handleImportFromText}
                                                className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium text-sm"
                                            >
                                                导入数据
                                            </button>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
                                            >
                                                上传文件
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
                                <div className="bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-bold text-slate-800">奖品设置</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleGenerateTestPrizes}
                                                className="px-4 py-2 bg-white border border-slate-200 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center gap-2"
                                            >
                                                🎁 一键生成奖品
                                            </button>
                                            <button
                                                onClick={() => setShowPrizeForm(!showPrizeForm)}
                                                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
                                            >
                                                {showPrizeForm ? '取消' : '+ 添加奖品'}
                                            </button>
                                        </div>
                                    </div>

                                    {showPrizeForm && (
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100 mb-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">奖品名称</label>
                                                <input
                                                    type="text"
                                                    value={newPrize.name}
                                                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                                    placeholder="例如：华为 Mate 60 Pro"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">等级</label>
                                                <select
                                                    value={newPrize.level}
                                                    onChange={(e) => setNewPrize({ ...newPrize, level: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => <option key={i} value={i}>{i}等奖</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">数量</label>
                                                <input
                                                    type="number"
                                                    value={newPrize.quantity}
                                                    onChange={(e) => setNewPrize({ ...newPrize, quantity: parseInt(e.target.value) || 1 })}
                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                                    min={1}
                                                />
                                            </div>
                                            <div className="md:col-span-4 flex justify-end">
                                                <button
                                                    onClick={handleAddPrize}
                                                    className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium text-sm"
                                                >
                                                    保存奖品
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {prizes.map((prize) => (
                                            <div
                                                key={prize.id}
                                                className="group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-slate-300"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg
                                                            ${prize.level === 1 ? 'bg-amber-100 text-amber-600' :
                                                                prize.level === 2 ? 'bg-slate-100 text-slate-600' :
                                                                    prize.level === 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                                            {prize.level}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-800">{prize.name}</h4>
                                                            <div className="text-xs text-slate-500 font-medium tracking-wide">{prize.level}等奖</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeletePrize(prize.id)}
                                                        className="text-white bg-rose-500 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-lg shadow-rose-500/30"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div className="mt-6 flex items-center justify-between">
                                                    <div className="text-xs font-semibold text-slate-400 uppercase">剩余库存</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-2xl font-bold ${prize.remainingQuantity === 0 ? 'text-slate-300' : 'text-slate-800'}`}>
                                                            {prize.remainingQuantity}
                                                        </span>
                                                        <span className="text-slate-400 text-sm">/ {prize.quantity}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${prize.remainingQuantity === 0 ? 'bg-slate-300' : 'bg-teal-500'}`}
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
                            <div className="bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="text-lg font-bold text-slate-800">中奖记录</h3>
                                    <button
                                        onClick={handleResetLottery}
                                        className="px-4 py-2 bg-white border border-rose-200 text-rose-500 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors"
                                    >
                                        重置所有记录
                                    </button>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">轮次</th>
                                            <th className="px-6 py-4">中奖者</th>
                                            <th className="px-6 py-4">奖品</th>
                                            <th className="px-6 py-4">时间</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {winners.map((w) => (
                                            <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 text-slate-500 text-sm">第 {w.round} 轮</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                            {w.participant?.name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-slate-800 font-medium">{w.participant?.name}</div>
                                                            <div className="text-xs text-slate-400">{w.participant?.department}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
                                                        {w.prize?.name}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-slate-400 text-sm font-mono">
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
