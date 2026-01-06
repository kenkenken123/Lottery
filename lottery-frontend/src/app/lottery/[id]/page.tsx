'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    getActivity,
    getAvailableParticipants,
    getPrizes,
    draw,
    getWinners,
    Activity,
    Participant,
    Prize,
    WinnerRecord,
} from '@/lib/api';

// 动态导入主题组件
const WheelTheme = dynamic(() => import('@/components/themes/WheelTheme'), { ssr: false });
const SphereTheme = dynamic(() => import('@/components/themes/SphereTheme'), { ssr: false });

/**
 * 抽奖页面
 */
export default function LotteryPage() {
    const params = useParams();
    const router = useRouter();
    const activityId = Number(params.id);

    const [activity, setActivity] = useState<Activity | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [winnerRecords, setWinnerRecords] = useState<WinnerRecord[]>([]);
    const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
    const [drawCount, setDrawCount] = useState(1);
    const [currentRound, setCurrentRound] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentWinners, setCurrentWinners] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    // 加载数据
    useEffect(() => {
        loadData();
    }, [activityId]);

    const loadData = async () => {
        try {
            const [activityData, participantsData, prizesData, winnersData] = await Promise.all([
                getActivity(activityId),
                getAvailableParticipants(activityId),
                getPrizes(activityId),
                getWinners(activityId),
            ]);

            setActivity(activityData);
            setParticipants(participantsData);
            setPrizes(prizesData);
            setWinnerRecords(winnersData);

            // 默认选择第一个有剩余的奖品
            const availablePrize = prizesData.find(p => p.remainingQuantity > 0);
            if (availablePrize) {
                setSelectedPrize(availablePrize);
            }

            // 计算当前轮次
            const maxRound = winnersData.reduce((max, w) => Math.max(max, w.round), 0);
            setCurrentRound(maxRound + 1);
        } catch (error) {
            console.error('加载数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 执行抽奖
    const handleDraw = async (): Promise<{ id: number; name: string }[]> => {
        if (!selectedPrize || isDrawing) return [];

        setIsDrawing(true);
        try {
            const result = await draw({
                activityId,
                prizeId: selectedPrize.id,
                count: drawCount,
                round: currentRound,
            });

            setCurrentWinners(result.winners);

            // 重新加载数据
            await loadData();

            return result.winners;
        } catch (error) {
            console.error('抽奖失败:', error);
            alert('抽奖失败：' + (error as Error).message);
            return [];
        } finally {
            setIsDrawing(false);
        }
    };

    // 清除本轮中奖者显示
    const clearCurrentWinners = () => {
        setCurrentWinners([]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent"></div>
                    <p className="text-white mt-4 text-xl">加载中...</p>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl">活动不存在</p>
                    <Link href="/" className="text-purple-300 hover:text-purple-100 mt-4 inline-block">
                        返回首页
                    </Link>
                </div>
            </div>
        );
    }

    // 根据主题类型渲染不同的抽奖界面
    const renderTheme = () => {
        const themeProps = {
            participants,
            drawCount,
            onDraw: handleDraw,
            isDrawing,
            winners: currentWinners,
        };

        switch (activity.themeType) {
            case 'sphere':
                return <SphereTheme {...themeProps} />;
            case 'wheel':
            default:
                return <WheelTheme {...themeProps} />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
            {/* 头部 */}
            <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <Link href="/" className="text-white/60 hover:text-white text-sm">
                            ← 返回活动列表
                        </Link>
                        <h1 className="text-2xl font-bold text-white">{activity.name}</h1>
                    </div>
                    <Link
                        href={`/admin/${activityId}`}
                        className="bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
                    >
                        ⚙️ 管理
                    </Link>
                </div>
            </header>

            {/* 主内容 */}
            <main className="container mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* 左侧：抽奖区域 */}
                    <div className="flex-1">
                        {renderTheme()}
                    </div>

                    {/* 右侧：控制面板 */}
                    <div className="w-full lg:w-80 space-y-6">
                        {/* 奖品选择 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-4">🏆 奖品设置</h3>

                            <div className="space-y-3">
                                {prizes.map((prize) => (
                                    <button
                                        key={prize.id}
                                        onClick={() => {
                                            setSelectedPrize(prize);
                                            clearCurrentWinners();
                                        }}
                                        disabled={prize.remainingQuantity === 0}
                                        className={`w-full p-3 rounded-xl text-left transition-all ${selectedPrize?.id === prize.id
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                : prize.remainingQuantity === 0
                                                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                                    : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">{prize.name}</span>
                                            <span className={`text-sm ${prize.remainingQuantity === 0 ? 'text-red-400' : ''}`}>
                                                剩余 {prize.remainingQuantity}/{prize.quantity}
                                            </span>
                                        </div>
                                        <div className="text-xs mt-1 opacity-60">
                                            {prize.level}等奖
                                        </div>
                                    </button>
                                ))}

                                {prizes.length === 0 && (
                                    <div className="text-white/40 text-center py-4">
                                        暂无奖品，请先添加
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 抽取数量 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-4">🎲 抽取设置</h3>

                            <div>
                                <label className="text-white/60 text-sm block mb-2">抽取人数</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setDrawCount(Math.max(1, drawCount - 1))}
                                        className="w-10 h-10 bg-white/20 text-white rounded-lg hover:bg-white/30"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={drawCount}
                                        onChange={(e) => setDrawCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="flex-1 h-10 bg-white/10 text-white text-center rounded-lg border border-white/20"
                                        min={1}
                                    />
                                    <button
                                        onClick={() => setDrawCount(drawCount + 1)}
                                        className="w-10 h-10 bg-white/20 text-white rounded-lg hover:bg-white/30"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="text-white/60 text-sm block mb-2">当前轮次</label>
                                <div className="text-2xl font-bold text-white">第 {currentRound} 轮</div>
                            </div>
                        </div>

                        {/* 统计信息 */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <h3 className="text-lg font-semibold text-white mb-4">📊 统计</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-400">{participants.length}</div>
                                    <div className="text-white/60 text-sm">待抽人数</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400">{winnerRecords.length}</div>
                                    <div className="text-white/60 text-sm">已中奖</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 中奖记录 */}
                {winnerRecords.length > 0 && (
                    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-4">🎉 中奖记录</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-white">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="py-2 px-4 text-left">轮次</th>
                                        <th className="py-2 px-4 text-left">中奖者</th>
                                        <th className="py-2 px-4 text-left">奖品</th>
                                        <th className="py-2 px-4 text-left">时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {winnerRecords.map((record) => (
                                        <tr key={record.id} className="border-b border-white/10">
                                            <td className="py-2 px-4">第 {record.round} 轮</td>
                                            <td className="py-2 px-4">{record.participant?.name}</td>
                                            <td className="py-2 px-4">{record.prize?.name}</td>
                                            <td className="py-2 px-4 text-white/60">
                                                {new Date(record.wonAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
