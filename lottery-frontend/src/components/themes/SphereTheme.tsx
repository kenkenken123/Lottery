'use client';

import { useState, useEffect, useRef } from 'react';

interface SphereThemeProps {
    participants: { id: number; name: string; code?: string }[];
    drawCount: number;
    onDraw: () => Promise<{ id: number; name: string }[]>;
    isDrawing: boolean;
    winners: { id: number; name: string }[];
}

interface Card {
    id: number;
    name: string;
    phi: number;
    theta: number;
    x: number;
    y: number;
    z: number;
    screenX: number;
    screenY: number;
    scale: number;
    // 额外的视觉属性
    opacity: number;
}

/**
 * 3D球体抽奖组件 - Matrix / Cyberpunk 风格
 */
export default function SphereTheme({
    participants,
    drawCount,
    onDraw,
    isDrawing,
    winners,
}: SphereThemeProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cards, setCards] = useState<Card[]>([]);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const animationRef = useRef<number>();
    const autoRotateRef = useRef<number>();

    const radius = 300; // 稍微增大半径
    const focalLength = 600;

    // Matrix Rain Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = canvas.offsetWidth;
        let height = canvas.height = canvas.offsetHeight;

        const columns = Math.floor(width / 20);
        const drops: number[] = new Array(columns).fill(1);
        const chars = "10"; // 二进制流

        const drawMatrix = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // 拖尾效果
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#0F0'; // 矩阵绿
            ctx.font = '14px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if (drops[i] * 20 > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            requestAnimationFrame(drawMatrix);
        };

        const handleResize = () => {
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', handleResize);
        const animId = requestAnimationFrame(drawMatrix);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animId);
        };
    }, []);

    // 初始化卡片位置
    useEffect(() => {
        const newCards: Card[] = participants.map((p, index) => {
            const phi = Math.acos(1 - 2 * (index + 0.5) / participants.length);
            const theta = Math.PI * (1 + Math.sqrt(5)) * index;
            return {
                id: p.id,
                name: p.name,
                phi,
                theta,
                x: 0, y: 0, z: 0,
                screenX: 0, screenY: 0, scale: 1, opacity: 1
            };
        });
        setCards(newCards);
    }, [participants]);

    // 更新3D位置 (保持原有逻辑，增加了一些视觉参数微调)
    const updateCardPositions = (rx: number, ry: number) => {
        setCards(prevCards =>
            prevCards.map(card => {
                let x = radius * Math.sin(card.phi) * Math.cos(card.theta);
                let y = radius * Math.sin(card.phi) * Math.sin(card.theta);
                let z = radius * Math.cos(card.phi);

                const cosRx = Math.cos(rx);
                const sinRx = Math.sin(rx);
                const y1 = y * cosRx - z * sinRx;
                const z1 = y * sinRx + z * cosRx;
                y = y1; z = z1;

                const cosRy = Math.cos(ry);
                const sinRy = Math.sin(ry);
                const x1 = x * cosRy + z * sinRy;
                const z2 = -x * sinRy + z * cosRy;
                x = x1; z = z2;

                const scale = focalLength / (focalLength + z);
                const screenX = x * scale;
                const screenY = y * scale;

                return { ...card, x, y, z, screenX, screenY, scale, opacity: Math.max(0.1, scale * scale) };
            })
        );
    };

    // 自动旋转 logic
    useEffect(() => {
        let lastTime = Date.now();
        const autoRotate = () => {
            const now = Date.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;
            if (!spinning) {
                setRotationY(prev => prev + delta * 0.2); // 更慢、更沉稳的旋转
            }
            autoRotateRef.current = requestAnimationFrame(autoRotate);
        };
        autoRotateRef.current = requestAnimationFrame(autoRotate);
        return () => { if (autoRotateRef.current) cancelAnimationFrame(autoRotateRef.current); };
    }, [spinning]);

    useEffect(() => {
        updateCardPositions(rotationX, rotationY);
    }, [rotationX, rotationY, cards.length]);

    // 抽奖逻辑
    const startSpin = async () => {
        if (spinning || isDrawing || participants.length === 0) return;
        setSpinning(true);
        const startTime = Date.now();
        const duration = 4000; // 稍长的动画时间
        const startRotationY = rotationY;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // 赛博朋克风格的加速减速：极速启动，缓慢刹车
            const eased = 1 - Math.pow(1 - progress, 4);
            const speed = 30 * (1 - eased);

            setRotationY(startRotationY + elapsed * speed * 0.02);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setSpinning(false);
                onDraw();
            }
        };
        animationRef.current = requestAnimationFrame(animate);
    };

    // 鼠标交互
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
        setRotationY(prev => prev + deltaX * 0.005);
        setRotationX(prev => prev + deltaY * 0.005);
        setLastMouse({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    }, []);

    const sortedCards = [...cards].sort((a, b) => b.z - a.z);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-center font-mono">

            {/* 1. 全局背景: Matrix Rain Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
            />

            {/* 2. 背景装饰: 赛博朋克 HUD 网格 */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: `
                    linear-gradient(rgba(0,255,0,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,255,0,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }} />

            {/* 顶部标题装饰 */}
            <div className="absolute top-10 left-0 w-full text-center pointer-events-none z-10">
                <div className="inline-block border border-[#0f0] bg-black/80 backdrop-blur-sm px-8 py-2 relative">
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#0f0]" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#0f0]" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#0f0]" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#0f0]" />
                    <h1 className="text-3xl font-black text-[#0f0] tracking-[0.5em] uppercase drop-shadow-[0_0_10px_rgba(0,255,0,0.8)]">
                        SYSTEM::LOTTERY_CORE
                    </h1>
                    <div className="text-[10px] text-[#0f0] tracking-widest mt-1 opacity-70">
                        SECURE CONNECTION ESTABLISHED // V.2026.01
                    </div>
                </div>
            </div>

            {/* 3D球体交互区域 */}
            <div
                ref={containerRef}
                className="relative w-[800px] h-[800px] cursor-crosshair active:cursor-grabbing z-20"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    perspective: '1200px',
                    perspectiveOrigin: 'center',
                }}
            >
                {/* 装饰性外环 HUD */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-[#0f0]/20 border-dashed animate-[spin_60s_linear_infinite] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full border border-[#0f0]/10 animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />

                {/* 球体中心 */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 preserve-3d">

                    {/* 核心发光体 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#0f0] blur-[150px] opacity-10 pointer-events-none animate-pulse" />

                    {/* 卡片渲染 */}
                    {sortedCards.map((card) => {
                        const isWinner = winners.some(w => w.id === card.id);
                        return (
                            <div
                                key={card.id}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2
                                     flex items-center gap-2 whitespace-nowrap transition-all duration-300
                                     ${isWinner
                                        ? 'z-[1000] scale-150'
                                        : 'hover:text-white'
                                    }`}
                                style={{
                                    left: card.screenX,
                                    top: card.screenY,
                                    transform: `translate(-50%, -50%) scale(${card.scale})`,
                                    opacity: isWinner ? 1 : card.opacity,
                                    zIndex: Math.round(card.scale * 100),
                                    filter: isWinner ? 'drop-shadow(0 0 15px #FFFF00)' : `blur(${(1 - card.scale) * 4}px)`,
                                }}
                            >
                                {/* 模拟二进制代码前缀 */}
                                <span className={`text-[10px] font-mono opacity-50 hidden md:inline-block ${isWinner ? 'text-yellow-400' : 'text-[#0f0]'}`}>
                                    {Math.random() > 0.5 ? '01' : '10'}
                                </span>

                                <div className={`
                                    px-3 py-1 border 
                                    ${isWinner
                                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-[0_0_20px_rgba(255,215,0,0.5)]'
                                        : 'bg-black/40 border-[#0f0]/40 text-[#0f0] shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                                    }
                                    backdrop-blur-sm
                                `}>
                                    <span className="font-bold tracking-wider text-sm md:text-base">
                                        {card.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 启动按钮 - 反应堆核心风格 */}
                <button
                    onClick={startSpin}
                    disabled={spinning || isDrawing}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                        group w-32 h-32 rounded-full z-50
                        flex items-center justify-center
                        transition-all duration-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                >
                    <div className="absolute inset-0 bg-black rounded-full border border-[#0f0] opacity-80 group-hover:opacity-100 transition-opacity" />
                    {/* 旋转的内环 */}
                    <div className="absolute inset-0 border-2 border-dashed border-[#0f0] rounded-full animate-[spin_4s_linear_infinite] opacity-50" />
                    <div className="absolute inset-2 border border-[#0f0] rounded-full animate-[spin_10s_linear_infinite_reverse] opacity-30" />

                    {/* 按钮文字/内容 */}
                    <div className="relative z-10 text-[#0f0] font-bold text-xl tracking-widest drop-shadow-[0_0_10px_rgba(0,255,0,1)] group-hover:scale-110 transition-transform">
                        {spinning ? (
                            <span className="animate-pulse">PROCESSING</span>
                        ) : (
                            <span>EXECUTE</span>
                        )}
                    </div>
                </button>
            </div>

            {/* 底部 HUD 状态栏 */}
            <div className="absolute bottom-10 flex gap-12 text-[#0f0] font-mono text-sm uppercase tracking-widest z-30">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] opacity-50 mb-1">Target Count</span>
                    <div className="border border-[#0f0] px-6 py-2 bg-black/60 shadow-[0_0_10px_rgba(0,255,0,0.2)]">
                        {drawCount}
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] opacity-50 mb-1">Data Points</span>
                    <div className="border border-[#0f0] px-6 py-2 bg-black/60 shadow-[0_0_10px_rgba(0,255,0,0.2)]">
                        {participants.length}
                    </div>
                </div>
            </div>

            {/* 中奖者展示覆盖层 */}
            {winners.length > 0 && (
                <div className="absolute top-32 w-full max-w-4xl z-40 pointer-events-none">
                    <div className="flex flex-wrap justify-center gap-6">
                        {winners.map((winner, idx) => (
                            <div
                                key={winner.id}
                                className="animate-[fadeInDown_0.5s_ease-out_forwards] pointer-events-auto"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <div className="relative bg-black/80 border border-yellow-400/50 px-8 py-4 text-center">
                                        <div className="text-[10px] text-yellow-400 opacity-60 mb-1">IDENTIFIED_WINNER</div>
                                        <div className="text-2xl font-black text-yellow-300 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,255,0,0.5)]">
                                            {winner.name}
                                        </div>
                                        {/* 装饰角标 */}
                                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-yellow-400" />
                                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-yellow-400" />
                                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-yellow-400" />
                                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-yellow-400" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

