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
 * 活动管理页面
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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                    <p className="mt-4 text-gray-600">加载中...</p>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">活动不存在</p>
                    <Link href="/" className="text-purple-600 hover:text-purple-800 mt-4 inline-block">
                        返回首页
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* 头部 */}
            <header className="bg-white shadow">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
                                ← 返回活动列表
                            </Link>
                            <h1 className="text-2xl font-bold text-gray-800">{activity.name} - 管理</h1>
                        </div>
                        <Link
                            href={`/lottery/${activityId}`}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg
                         hover:from-green-600 hover:to-emerald-700 transition-all"
                        >
                            🎯 开始抽奖
                        </Link>
                    </div>
                </div>
            </header>

            {/* 标签页导航 */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-6">
                    <div className="flex gap-1">
                        {(['participants', 'prizes', 'winners'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 font-medium transition-all border-b-2 ${activeTab === tab
                                        ? 'text-purple-600 border-purple-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'participants' && `👥 参与者 (${participants.length})`}
                                {tab === 'prizes' && `🏆 奖品 (${prizes.length})`}
                                {tab === 'winners' && `🎉 中奖记录 (${winners.length})`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 主内容 */}
            <main className="container mx-auto px-6 py-8">
                {/* 参与者管理 */}
                {activeTab === 'participants' && (
                    <div className="space-y-6">
                        {/* 导入区域 */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <h3 className="text-lg font-semibold mb-4">批量导入参与者</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                每行一个参与者，格式：姓名,编号,部门（编号和部门可选）
                            </p>

                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder={`张三,001,技术部\n李四,002,市场部\n王五`}
                            />

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={handleImportFromText}
                                    disabled={!importText.trim()}
                                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    导入
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-all"
                                >
                                    从文件导入
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt,.csv"
                                    onChange={handleFileImport}
                                    className="hidden"
                                />
                                <button
                                    onClick={handleClearParticipants}
                                    disabled={participants.length === 0}
                                    className="bg-red-50 text-red-600 px-6 py-2 rounded-lg hover:bg-red-100 transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                                >
                                    清空全部
                                </button>
                            </div>
                        </div>

                        {/* 参与者列表 */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">#</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">姓名</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">编号</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">部门</th>
                                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">状态</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {participants.map((p, index) => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                                                <td className="py-3 px-4 font-medium">{p.name}</td>
                                                <td className="py-3 px-4 text-gray-500">{p.code || '-'}</td>
                                                <td className="py-3 px-4 text-gray-500">{p.department || '-'}</td>
                                                <td className="py-3 px-4">
                                                    {p.isWinner ? (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                                            已中奖
                                                        </span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                            待抽奖
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {participants.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-gray-400">
                                                    暂无参与者，请先导入
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 奖品管理 */}
                {activeTab === 'prizes' && (
                    <div className="space-y-6">
                        {/* 添加奖品 */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">奖品列表</h3>
                                <button
                                    onClick={() => setShowPrizeForm(!showPrizeForm)}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all"
                                >
                                    {showPrizeForm ? '取消' : '➕ 添加奖品'}
                                </button>
                            </div>

                            {showPrizeForm && (
                                <div className="border-t pt-4 mt-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">奖品名称</label>
                                            <input
                                                type="text"
                                                value={newPrize.name}
                                                onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                placeholder="例如：iPhone 15"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">等级</label>
                                            <select
                                                value={newPrize.level}
                                                onChange={(e) => setNewPrize({ ...newPrize, level: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                            >
                                                <option value={1}>一等奖</option>
                                                <option value={2}>二等奖</option>
                                                <option value={3}>三等奖</option>
                                                <option value={4}>四等奖</option>
                                                <option value={5}>五等奖</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">数量</label>
                                            <input
                                                type="number"
                                                value={newPrize.quantity}
                                                onChange={(e) => setNewPrize({ ...newPrize, quantity: parseInt(e.target.value) || 1 })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                                min={1}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleAddPrize}
                                        disabled={!newPrize.name.trim()}
                                        className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        确认添加
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 奖品列表 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {prizes.map((prize) => (
                                <div
                                    key={prize.id}
                                    className="bg-white rounded-xl p-6 shadow-sm border-l-4"
                                    style={{
                                        borderColor: ['#FFD700', '#C0C0C0', '#CD7F32', '#1E90FF', '#32CD32'][prize.level - 1] || '#gray',
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-lg">{prize.name}</h4>
                                            <p className="text-gray-500 text-sm">{prize.level}等奖</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeletePrize(prize.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-gray-500">总数量</span>
                                        <span className="font-bold">{prize.quantity}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-500">剩余</span>
                                        <span className={`font-bold ${prize.remainingQuantity === 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {prize.remainingQuantity}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {prizes.length === 0 && (
                                <div className="col-span-full bg-white rounded-xl p-12 text-center text-gray-400">
                                    暂无奖品，点击上方按钮添加
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 中奖记录 */}
                {activeTab === 'winners' && (
                    <div className="space-y-6">
                        {/* 操作按钮 */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleResetLottery}
                                disabled={winners.length === 0}
                                className="bg-red-50 text-red-600 px-6 py-2 rounded-lg hover:bg-red-100 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                🔄 重置抽奖结果
                            </button>
                        </div>

                        {/* 记录列表 */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">轮次</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">中奖者</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">编号</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">部门</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">奖品</th>
                                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500">时间</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {winners.map((w) => (
                                        <tr key={w.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">第 {w.round} 轮</td>
                                            <td className="py-3 px-4 font-medium">{w.participant?.name}</td>
                                            <td className="py-3 px-4 text-gray-500">{w.participant?.code || '-'}</td>
                                            <td className="py-3 px-4 text-gray-500">{w.participant?.department || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
                                                    {w.prize?.name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500 text-sm">
                                                {new Date(w.wonAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {winners.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-gray-400">
                                                暂无中奖记录
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
