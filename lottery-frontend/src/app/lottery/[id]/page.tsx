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

// 主题样式配置
const THEME_STYLES = {
    wheel: {
        // Pokemon 风格: 明亮、红白配色
        wrapper: "min-h-screen bg-[#f0f2f5] text-slate-800",
        header: "bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm",
        headerText: "text-slate-800",
        backLink: "text-slate-500 hover:text-red-500",
        adminButton: "bg-slate-800 text-white hover:bg-slate-700",
        card: "bg-white rounded-2xl p-6 shadow-xl border border-slate-100",
        cardTitle: "text-lg font-bold text-slate-800 mb-4 flex items-center gap-2",
        textPrimary: "text-slate-800",
        textSecondary: "text-slate-500",
        input: "bg-slate-50 border border-slate-200 text-slate-800 focus:border-red-500 focus:ring-red-500",
        prizeActive: "bg-red-50 border-red-200 text-red-600 ring-1 ring-red-200",
        prizeInactive: "bg-white hover:bg-slate-50 text-slate-600 border border-transparent",
        prizeDisabled: "bg-slate-50 text-slate-300 cursor-not-allowed",
        statValue: "text-3xl font-black text-slate-800",
        statLabel: "text-slate-400 text-xs font-bold uppercase tracking-wider",
        tableHeader: "bg-slate-50 text-slate-500 text-xs uppercase font-bold",
        tableRow: "border-b border-slate-100 hover:bg-slate-50/50",
    },
    sphere: {
        // Matrix 风格: 黑暗、绿色荧光
        wrapper: "min-h-screen bg-black text-green-500 font-mono",
        header: "bg-black/80 backdrop-blur-md border-b border-green-500/30 shadow-[0_0_15px_rgba(0,255,0,0.2)]",
        headerText: "text-green-400 text-shadow-green",
        backLink: "text-green-700 hover:text-green-400",
        adminButton: "border border-green-500 text-green-500 hover:bg-green-500/10 hover:shadow-[0_0_10px_rgba(0,255,0,0.4)]",
        card: "bg-black/60 backdrop-blur-sm rounded-none p-6 border border-green-500/30 shadow-[0_0_10px_rgba(0,255,0,0.1)] relative overflow-hidden",
        cardTitle: "text-lg font-bold text-green-400 mb-4 tracking-widest uppercase border-b border-green-900/50 pb-2",
        textPrimary: "text-green-400",
        textSecondary: "text-green-700",
        input: "bg-black border border-green-800 text-green-400 focus:border-green-500 focus:shadow-[0_0_10px_rgba(0,255,0,0.3)]",
        prizeActive: "bg-green-900/30 border-green-500/50 text-green-300 shadow-[inset_0_0_10px_rgba(0,255,0,0.1)]",
        prizeInactive: "bg-black hover:bg-green-900/20 text-green-600 border border-green-900/30",
        prizeDisabled: "bg-black/50 text-green-900 border border-green-900/10 cursor-not-allowed",
        statValue: "text-3xl font-bold text-green-400 text-shadow-green",
        statLabel: "text-green-800 text-xs font-medium uppercase tracking-[0.2em]",
        tableHeader: "bg-green-900/20 text-green-600 text-xs uppercase tracking-wider",
        tableRow: "border-b border-green-900/30 hover:bg-green-900/10",
    }
};

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
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-white"></div>
                </div>
            </div>
        );
    }

    if (!activity) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
                    <p className="text-slate-800 text-xl font-bold mb-2">活动不存在</p>
                    <Link href="/" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 inline-block">
                        返回首页
                    </Link>
                </div>
            </div>
        );
    }

    // 获取当前主题的样式配置
    const theme = activity.themeType === 'sphere' ? THEME_STYLES.sphere : THEME_STYLES.wheel;

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
        <div className={theme.wrapper}>
            {/* 头部 */}
            <header className={`sticky top-0 z-50 ${theme.header}`}>
                <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className={`text-sm font-medium transition-colors ${theme.backLink}`}>
                            ← 返回列表
                        </Link>
                        <h1 className={`text-xl font-bold ${theme.headerText}`}>{activity.name}</h1>
                    </div>
                    <Link
                        href={`/admin/${activityId}`}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${theme.adminButton}`}
                    >
                        ⚙️ 管理后台
                    </Link>
                </div>
            </header>

            {/* 主内容 */}
            <main className="container mx-auto px-4 py-6 h-[calc(100vh-64px)] overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    {/* 左侧：抽奖区域 */}
                    <div className="flex-1 relative h-full rounded-2xl overflow-hidden shadow-2xl">
                        {renderTheme()}
                    </div>

                    {/* 右侧：控制面板 */}
                    <div className="w-full lg:w-80 h-full overflow-y-auto space-y-4 no-scrollbar pb-20">

                        {/* 1. 奖品选择 */}
                        <div className={theme.card}>
                            <h3 className={theme.cardTitle}>
                                {activity.themeType === 'wheel' ? '🎁' : '>>'} 奖品设置
                                {activity.themeType === 'sphere' && <span className="animate-pulse ml-2 text-green-500">_</span>}
                            </h3>

                            <div className="space-y-2">
                                {prizes.map((prize) => (
                                    <button
                                        key={prize.id}
                                        onClick={() => {
                                            setSelectedPrize(prize);
                                            clearCurrentWinners();
                                        }}
                                        disabled={prize.remainingQuantity === 0}
                                        className={`w-full p-3 rounded-xl text-left transition-all border ${selectedPrize?.id === prize.id
                                                ? theme.prizeActive
                                                : prize.remainingQuantity === 0
                                                    ? theme.prizeDisabled
                                                    : theme.prizeInactive
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">{prize.name}</span>
                                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${prize.remainingQuantity === 0 ? 'bg-slate-200 text-slate-500' : 'bg-current/10'
                                                }`}>
                                                {prize.remainingQuantity}/{prize.quantity}
                                            </span>
                                        </div>
                                        <div className={`text-xs mt-1 ${theme.textSecondary}`}>
                                            {prize.level}等奖
                                        </div>
                                    </button>
                                ))}

                                {prizes.length === 0 && (
                                    <div className={`text-center py-8 ${theme.textSecondary}`}>
                                        暂无奖品
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. 抽取设置 */}
                        <div className={theme.card}>
                            <h3 className={theme.cardTitle}>
                                {activity.themeType === 'wheel' ? '🎲' : '>>'} 抽取配置
                            </h3>

                            <div className="flex justify-between items-center mb-4">
                                <label className={`text-sm font-medium ${theme.textSecondary}`}>本轮人数</label>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setDrawCount(Math.max(1, drawCount - 1))}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors ${activity.themeType === 'sphere'
                                                ? 'bg-green-900/20 text-green-500 hover:bg-green-900/40'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={drawCount}
                                        onChange={(e) => setDrawCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        className={`w-14 h-8 text-center rounded-lg text-sm font-bold mx-1 outline-none ${theme.input} `}
                                        min={1}
                                    />
                                    <button
                                        onClick={() => setDrawCount(drawCount + 1)}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold transition-colors ${activity.themeType === 'sphere'
                                                ? 'bg-green-900/20 text-green-500 hover:bg-green-900/40'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-center">
                                <label className={`text-sm font-medium ${theme.textSecondary}`}>当前进度</label>
                                <div className={`text-lg font-bold ${theme.textPrimary}`}>第 {currentRound} 轮</div>
                            </div>
                        </div>

                        {/* 3. 实时统计 */}
                        <div className={theme.card}>
                            <div className="grid grid-cols-2 gap-4 divide-x divide-gray-200/10">
                                <div className="text-center">
                                    <div className={theme.statValue}>{participants.length}</div>
                                    <div className={theme.statLabel}>待抽奖</div>
                                </div>
                                <div className="text-center pl-4">
                                    <div className={theme.statValue}>{winnerRecords.length}</div>
                                    <div className={theme.statLabel}>已中奖</div>
                                </div>
                            </div>
                        </div>

                        {/* 4. 最新中奖 (简略版，详细请去后台) */}
                        {winnerRecords.length > 0 && (
                            <div className={`${theme.card} flex-1 min-h-[200px] overflow-hidden flex flex-col`}>
                                <h3 className={theme.cardTitle}>
                                    {activity.themeType === 'wheel' ? '🏆' : '>>'} 最新中奖
                                </h3>
                                <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                    <table className="w-full text-left">
                                        <thead className={`sticky top-0 z-10 ${theme.tableHeader}`}>
                                            <tr>
                                                <th className="py-2 pl-2">中奖者</th>
                                                <th className="py-2 text-right">奖品</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {[...winnerRecords].reverse().slice(0, 50).map((record) => (
                                                <tr key={record.id} className={theme.tableRow}>
                                                    <td className={`py-2 pl-2 font-medium ${theme.textPrimary}`}>
                                                        {record.participant?.name}
                                                        <span className={`block text-[10px] ${theme.textSecondary}`}>
                                                            第{record.round}轮
                                                        </span>
                                                    </td>
                                                    <td className={`py-2 text-right ${theme.textSecondary}`}>
                                                        {record.prize?.name}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
