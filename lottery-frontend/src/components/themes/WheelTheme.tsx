'use client';

import { useState, useEffect, useRef } from 'react';

// 转盘样式颜色
const WHEEL_COLORS = [
    '#FF6B6B', // 红色
    '#4ECDC4', // 青色
    '#45B7D1', // 蓝色
    '#96CEB4', // 绿色
    '#FFEAA7', // 黄色
    '#DDA0DD', // 紫色
    '#F39C12', // 橙色
    '#3498DB', // 深蓝
];

interface WheelThemeProps {
    // 参与者列表
    participants: { id: number; name: string; code?: string }[];
    // 抽取数量
    drawCount: number;
    // 抽奖回调
    onDraw: () => Promise<{ id: number; name: string }[]>;
    // 是否正在抽奖
    isDrawing: boolean;
    // 中奖者列表
    winners: { id: number; name: string }[];
}

/**
 * 经典转盘抽奖组件
 */
export default function WheelTheme({
    participants,
    drawCount,
    onDraw,
    isDrawing,
    winners,
}: WheelThemeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const animationRef = useRef<number>();

    // 绘制转盘
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 保存当前状态
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        const displayParticipants = participants.slice(0, 12); // 最多显示12个
        const segmentAngle = (2 * Math.PI) / displayParticipants.length;

        // 绘制每个扇形
        displayParticipants.forEach((participant, index) => {
            const startAngle = index * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = WHEEL_COLORS[index % WHEEL_COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 绘制文字
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 2;
            const displayName = participant.name.length > 6
                ? participant.name.slice(0, 6) + '...'
                : participant.name;
            ctx.fillText(displayName, radius - 20, 5);
            ctx.restore();
        });

        ctx.restore();

        // 绘制中心圆
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, 2 * Math.PI);
        ctx.fillStyle = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
        gradient.addColorStop(0, '#764ba2');
        gradient.addColorStop(1, '#667eea');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 绘制指针
        ctx.beginPath();
        ctx.moveTo(centerX + radius + 15, centerY);
        ctx.lineTo(centerX + radius - 5, centerY - 15);
        ctx.lineTo(centerX + radius - 5, centerY + 15);
        ctx.closePath();
        ctx.fillStyle = '#FF4757';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

    }, [rotation, participants]);

    // 开始抽奖动画
    const startSpin = async () => {
        if (spinning || isDrawing || participants.length === 0) return;

        setSpinning(true);

        // 随机转动圈数 (3-5圈)
        const spins = 3 + Math.random() * 2;
        const totalRotation = spins * 360;
        const duration = 4000; // 4秒
        const startTime = Date.now();
        const startRotation = rotation;

        // 缓动函数
        const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOut(progress);

            setRotation(startRotation + totalRotation * easedProgress);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setSpinning(false);
                // 动画结束后执行抽奖
                onDraw();
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    // 清理动画
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col items-center gap-8 p-8">
            {/* 转盘 */}
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={500}
                    height={500}
                    className="drop-shadow-2xl"
                />

                {/* 中心抽奖按钮 */}
                <button
                    onClick={startSpin}
                    disabled={spinning || isDrawing || participants.length === 0}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                     w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                     text-white font-bold text-lg shadow-lg 
                     hover:from-purple-600 hover:to-pink-600 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 z-10"
                >
                    {spinning ? '抽奖中' : '抽奖'}
                </button>
            </div>

            {/* 统计信息 */}
            <div className="flex gap-8 text-lg">
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
                    <span className="text-gray-600">参与人数:</span>
                    <span className="ml-2 font-bold text-purple-600">{participants.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
                    <span className="text-gray-600">抽取数量:</span>
                    <span className="ml-2 font-bold text-pink-600">{drawCount}</span>
                </div>
            </div>

            {/* 中奖者展示 */}
            {winners.length > 0 && (
                <div className="mt-8 w-full max-w-2xl">
                    <h3 className="text-2xl font-bold text-center mb-4 text-purple-600">
                        🎉 恭喜中奖 🎉
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {winners.map((winner) => (
                            <div
                                key={winner.id}
                                className="bg-gradient-to-br from-yellow-400 to-orange-500 
                           text-white rounded-xl p-4 text-center shadow-lg
                           transform hover:scale-105 transition-transform"
                            >
                                <div className="text-2xl mb-2">🏆</div>
                                <div className="font-bold text-lg">{winner.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
