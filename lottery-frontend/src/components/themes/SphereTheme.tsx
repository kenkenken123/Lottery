'use client';

import { useState, useEffect, useRef } from 'react';

interface SphereThemeProps {
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

// 3D 名片卡片接口
interface Card {
    id: number;
    name: string;
    // 球面坐标
    phi: number;
    theta: number;
    // 3D 坐标
    x: number;
    y: number;
    z: number;
    // 屏幕坐标
    screenX: number;
    screenY: number;
    scale: number;
}

/**
 * 3D球体抽奖组件
 * 参与者名字在3D球体表面飘动
 */
export default function SphereTheme({
    participants,
    drawCount,
    onDraw,
    isDrawing,
    winners,
}: SphereThemeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const animationRef = useRef<number>();
    const autoRotateRef = useRef<number>();

    const radius = 250; // 球体半径
    const focalLength = 500; // 焦距

    // 初始化卡片位置
    useEffect(() => {
        const newCards: Card[] = participants.map((p, index) => {
            // 使用斐波那契球面分布算法
            const phi = Math.acos(1 - 2 * (index + 0.5) / participants.length);
            const theta = Math.PI * (1 + Math.sqrt(5)) * index;

            return {
                id: p.id,
                name: p.name,
                phi,
                theta,
                x: 0,
                y: 0,
                z: 0,
                screenX: 0,
                screenY: 0,
                scale: 1,
            };
        });
        setCards(newCards);
    }, [participants]);

    // 更新卡片3D位置
    const updateCardPositions = (rx: number, ry: number) => {
        setCards(prevCards =>
            prevCards.map(card => {
                // 基础球面坐标转笛卡尔坐标
                let x = radius * Math.sin(card.phi) * Math.cos(card.theta);
                let y = radius * Math.sin(card.phi) * Math.sin(card.theta);
                let z = radius * Math.cos(card.phi);

                // 应用旋转 (绕X轴)
                const cosRx = Math.cos(rx);
                const sinRx = Math.sin(rx);
                const y1 = y * cosRx - z * sinRx;
                const z1 = y * sinRx + z * cosRx;
                y = y1;
                z = z1;

                // 应用旋转 (绕Y轴)
                const cosRy = Math.cos(ry);
                const sinRy = Math.sin(ry);
                const x1 = x * cosRy + z * sinRy;
                const z2 = -x * sinRy + z * cosRy;
                x = x1;
                z = z2;

                // 透视投影
                const scale = focalLength / (focalLength + z);
                const screenX = x * scale;
                const screenY = y * scale;

                return {
                    ...card,
                    x,
                    y,
                    z,
                    screenX,
                    screenY,
                    scale,
                };
            })
        );
    };

    // 自动旋转
    useEffect(() => {
        let lastTime = Date.now();

        const autoRotate = () => {
            const now = Date.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            if (!spinning) {
                setRotationY(prev => prev + delta * 0.5); // 慢速自动旋转
            }

            autoRotateRef.current = requestAnimationFrame(autoRotate);
        };

        autoRotateRef.current = requestAnimationFrame(autoRotate);

        return () => {
            if (autoRotateRef.current) {
                cancelAnimationFrame(autoRotateRef.current);
            }
        };
    }, [spinning]);

    // 更新卡片位置
    useEffect(() => {
        updateCardPositions(rotationX, rotationY);
    }, [rotationX, rotationY, cards.length]);

    // 开始抽奖动画
    const startSpin = async () => {
        if (spinning || isDrawing || participants.length === 0) return;

        setSpinning(true);

        // 快速旋转动画
        const startTime = Date.now();
        const duration = 3000; // 3秒
        const startRotationY = rotationY;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 缓动 - 先快后慢
            const eased = 1 - Math.pow(1 - progress, 3);
            const speed = 20 * (1 - eased) + 0.5; // 从快到慢

            setRotationY(startRotationY + elapsed * speed * 0.01);

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

    // 鼠标拖拽旋转
    const [isDragging, setIsDragging] = useState(false);
    const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if (spinning) return;
        setIsDragging(true);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || spinning) return;

        const deltaX = e.clientX - lastMouse.x;
        const deltaY = e.clientY - lastMouse.y;

        setRotationY(prev => prev + deltaX * 0.01);
        setRotationX(prev => prev + deltaY * 0.01);

        setLastMouse({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 清理动画
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // 按z轴排序，远的先渲染
    const sortedCards = [...cards].sort((a, b) => b.z - a.z);

    return (
        <div className="flex flex-col items-center gap-8 p-8">
            {/* 3D球体容器 */}
            <div
                ref={containerRef}
                className="relative w-[600px] h-[600px] cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    perspective: '1000px',
                    perspectiveOrigin: 'center',
                }}
            >
                {/* 背景光晕 */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(102,126,234,0.2) 0%, transparent 70%)',
                    }}
                />

                {/* 球体中心 */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    {/* 渲染所有卡片 */}
                    {sortedCards.map((card) => (
                        <div
                            key={card.id}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2
                         px-4 py-2 rounded-lg font-bold text-white
                         transition-opacity duration-300
                         ${winners.some(w => w.id === card.id)
                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
                            style={{
                                left: card.screenX,
                                top: card.screenY,
                                transform: `translate(-50%, -50%) scale(${card.scale})`,
                                opacity: 0.3 + card.scale * 0.7,
                                zIndex: Math.round(card.scale * 100),
                                fontSize: `${12 + card.scale * 4}px`,
                            }}
                        >
                            {card.name}
                        </div>
                    ))}
                </div>

                {/* 中心抽奖按钮 */}
                <button
                    onClick={startSpin}
                    disabled={spinning || isDrawing || participants.length === 0}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     w-24 h-24 rounded-full 
                     bg-gradient-to-br from-indigo-600 to-purple-700
                     text-white font-bold text-xl shadow-2xl
                     hover:from-indigo-700 hover:to-purple-800
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-300 z-50
                     border-4 border-white/30"
                >
                    {spinning ? '🎲' : '开始'}
                </button>
            </div>

            {/* 统计信息 */}
            <div className="flex gap-8 text-lg">
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                    <span className="text-gray-600">参与人数:</span>
                    <span className="ml-2 font-bold text-indigo-600">{participants.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
                    <span className="text-gray-600">抽取数量:</span>
                    <span className="ml-2 font-bold text-purple-600">{drawCount}</span>
                </div>
            </div>

            {/* 中奖者展示 */}
            {winners.length > 0 && (
                <div className="mt-4 w-full max-w-3xl">
                    <h3 className="text-2xl font-bold text-center mb-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text">
                        ✨ 幸运儿诞生 ✨
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4">
                        {winners.map((winner) => (
                            <div
                                key={winner.id}
                                className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500
                           text-white rounded-2xl px-6 py-4 text-center shadow-xl
                           transform hover:scale-110 transition-all duration-300
                           animate-bounce"
                                style={{
                                    animationDelay: `${Math.random() * 0.5}s`,
                                    animationDuration: '1s',
                                }}
                            >
                                <div className="text-3xl mb-1">🎉</div>
                                <div className="font-bold text-xl">{winner.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
