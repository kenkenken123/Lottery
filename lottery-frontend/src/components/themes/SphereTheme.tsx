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
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-[#0F0F23] via-[#1a1a3e] to-black flex flex-col items-center justify-center font-mono">

            {/* 1. 全局背景: Matrix Rain Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
            />

            {/* 2. 背景装饰: 赛博朋克 HUD 网格 */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: `
                    linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
            }} />

            {/* 额外的赛博效果: 扫描线 */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF41] to-transparent opacity-50 animate-[scanline_4s_linear_infinite]" />

            {/* 顶部标题装饰 - 增强版 */}
            <div className="absolute top-10 left-0 w-full text-center pointer-events-none z-10">
                <div className="inline-block relative">
                    {/* 外发光 */}
                    <div className="absolute inset-0 bg-[#7C3AED] blur-3xl opacity-20 animate-pulse" />

                    <div className="relative border-2 border-[#7C3AED] bg-black/90 backdrop-blur-md px-12 py-4 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
                        {/* 角标 */}
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FF41]" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#00FF41]" />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#00FF41]" />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#00FF41]" />

                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FF41] via-[#7C3AED] to-[#A78BFA] tracking-[0.5em] uppercase drop-shadow-[0_0_20px_rgba(0,255,65,0.8)]">
                            SYSTEM::LOTTERY_CORE
                        </h1>
                        <div className="text-xs text-[#A78BFA] tracking-[0.3em] mt-2 opacity-80 font-bold">
                            <span className="text-[#00FF41]">■</span> SECURE CONNECTION ESTABLISHED <span className="text-[#00FF41]">■</span> V.2026.01
                        </div>
                    </div>
                </div>
            </div>

            {/* 3D球体交互区域 - 增强版 */}
            <div
                ref={containerRef}
                className="relative w-[900px] h-[900px] cursor-crosshair active:cursor-grabbing z-20"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    perspective: '1400px',
                    perspectiveOrigin: 'center',
                }}
            >
                {/* 装饰性外环 HUD - 增强版 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border-2 border-[#7C3AED]/30 border-dashed animate-[spin_60s_linear_infinite] pointer-events-none shadow-[0_0_30px_rgba(124,58,237,0.3)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-[#00FF41]/20 animate-[spin_40s_linear_infinite_reverse] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-[#A78BFA]/10 animate-[spin_80s_linear_infinite] pointer-events-none" />

                {/* 球体中心 */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 preserve-3d">

                    {/* 核心发光体 - 增强版 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-[#7C3AED] via-[#00FF41] to-[#A78BFA] blur-[180px] opacity-15 pointer-events-none animate-pulse" />

                    {/* 卡片渲染 - 美化版 */}
                    {sortedCards.map((card) => {
                        const isWinner = winners.some(w => w.id === card.id);
                        return (
                            <div
                                key={card.id}
                                className={`absolute transform -translate-x-1/2 -translate-y-1/2
                                     flex items-center gap-2 whitespace-nowrap transition-all duration-300
                                     ${isWinner
                                        ? 'z-[1000] scale-150'
                                        : 'hover:scale-110'
                                    }`}
                                style={{
                                    left: card.screenX,
                                    top: card.screenY,
                                    transform: `translate(-50%, -50%) scale(${card.scale})`,
                                    opacity: isWinner ? 1 : card.opacity,
                                    zIndex: Math.round(card.scale * 100),
                                    filter: isWinner
                                        ? 'drop-shadow(0 0 20px #F43F5E) drop-shadow(0 0 40px #7C3AED)'
                                        : `blur(${(1 - card.scale) * 3}px) drop-shadow(0 0 5px rgba(124,58,237,0.3))`,
                                }}
                            >
                                {/* 模拟二进制代码前缀 */}
                                <span className={`text-[10px] font-mono opacity-60 hidden md:inline-block ${isWinner ? 'text-[#F43F5E]' : 'text-[#00FF41]'}`}>
                                    {Math.random() > 0.5 ? '01' : '10'}
                                </span>

                                <div className={`
                                    px-4 py-2 border-2 rounded-lg
                                    ${isWinner
                                        ? 'bg-gradient-to-r from-[#F43F5E]/30 to-[#7C3AED]/30 border-[#F43F5E] text-white shadow-[0_0_30px_rgba(244,63,94,0.6)]'
                                        : 'bg-black/60 border-[#7C3AED]/50 text-[#E2E8F0] shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                                    }
                                    backdrop-blur-md transition-all duration-300
                                `}>
                                    <span className="font-bold tracking-wider text-sm md:text-base">
                                        {card.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 启动按钮 - 反应堆核心风格增强版 */}
                <button
                    onClick={startSpin}
                    disabled={spinning || isDrawing}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                        group w-40 h-40 rounded-full z-50
                        flex items-center justify-center
                        transition-all duration-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        hover:scale-110
                    "
                >
                    {/* 外发光效果 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#7C3AED] to-[#F43F5E] rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />

                    <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a1a3e] to-black rounded-full border-2 border-[#7C3AED] opacity-90 group-hover:opacity-100 transition-all shadow-[0_0_30px_rgba(124,58,237,0.5)]" />

                    {/* 旋转的内环 */}
                    <div className="absolute inset-0 border-2 border-dashed border-[#00FF41] rounded-full animate-[spin_4s_linear_infinite] opacity-40" />
                    <div className="absolute inset-3 border border-[#A78BFA] rounded-full animate-[spin_10s_linear_infinite_reverse] opacity-30" />
                    <div className="absolute inset-6 border border-[#F43F5E] rounded-full animate-[spin_6s_linear_infinite] opacity-20" />

                    {/* 按钮文字/内容 */}
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF41] via-[#7C3AED] to-[#F43F5E] font-black text-2xl tracking-[0.3em] drop-shadow-[0_0_15px_rgba(0,255,65,1)] group-hover:scale-110 transition-transform">
                            {spinning ? (
                                <span className="animate-pulse">PROCESSING</span>
                            ) : (
                                <span>EXECUTE</span>
                            )}
                        </div>
                        <div className="text-[10px] text-[#A78BFA] mt-2 tracking-widest opacity-70">
                            {spinning ? 'ANALYZING...' : 'CLICK TO START'}
                        </div>
                    </div>
                </button>
            </div>

            {/* 底部 HUD 状态栏 - 美化版 */}
            <div className="absolute bottom-10 flex gap-16 text-[#E2E8F0] font-mono text-sm uppercase tracking-widest z-30">
                <div className="flex flex-col items-center group">
                    <span className="text-[10px] text-[#A78BFA] opacity-70 mb-2 tracking-[0.2em]">▸ Target Count</span>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#7C3AED] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative border-2 border-[#7C3AED] px-8 py-3 bg-black/80 backdrop-blur-sm shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FF41] to-[#7C3AED]">{drawCount}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center group">
                    <span className="text-[10px] text-[#A78BFA] opacity-70 mb-2 tracking-[0.2em]">▸ Data Points</span>
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#00FF41] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative border-2 border-[#00FF41] px-8 py-3 bg-black/80 backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,65,0.3)]">
                            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#00FF41]">{participants.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 中奖者展示覆盖层 - 美化版 */}
            {winners.length > 0 && (
                <div className="absolute top-32 w-full max-w-5xl z-40 pointer-events-none">
                    <div className="flex flex-wrap justify-center gap-8">
                        {winners.map((winner, idx) => (
                            <div
                                key={winner.id}
                                className="animate-[fadeInDown_0.6s_ease-out_forwards] pointer-events-auto"
                                style={{ animationDelay: `${idx * 0.15}s` }}
                            >
                                <div className="relative group">
                                    {/* 外发光 */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#F43F5E] via-[#7C3AED] to-[#00FF41] blur-2xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse" />

                                    <div className="relative bg-gradient-to-br from-black via-[#1a1a3e] to-black border-2 border-[#F43F5E] px-10 py-6 text-center backdrop-blur-md shadow-[0_0_40px_rgba(244,63,94,0.5)]">
                                        {/* 角标 */}
                                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-[#00FF41]" />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-[#00FF41]" />
                                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-[#00FF41]" />
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-[#00FF41]" />

                                        <div className="text-[10px] text-[#A78BFA] opacity-80 mb-2 tracking-[0.3em] font-bold">▸ IDENTIFIED_WINNER ◂</div>
                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F43F5E] via-[#7C3AED] to-[#00FF41] tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]">
                                            {winner.name}
                                        </div>
                                        <div className="text-[10px] text-[#00FF41] mt-2 opacity-60 tracking-widest">ID: {winner.id}</div>
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

