'use client';

import { useState, useEffect, useRef } from 'react';

// Pokémon Style Colors
const WHEEL_COLORS = [
    '#FF0000', // Poké Ball Red
    '#3B4CCA', // Pokémon Blue
    '#FFDE00', // Pikachu Yellow
    '#CC0000', // Darker Red
    '#B3A125', // Gold/Badge
    '#FFFFFF', // Premier Ball White (with border)
    '#4DAD5B', // Leaf Green
    '#EE8130', // Fire Orange
];

// Helper to darken color for gradient
// Simplification, real implementation would parse hex
function adjustColor(color: string, amount: number) {
    return color;
}

interface WheelThemeProps {
    participants: { id: number; name: string; code?: string }[];
    drawCount: number;
    onDraw: () => Promise<{ id: number; name: string }[]>;
    isDrawing: boolean;
    winners: { id: number; name: string }[];
}

/**
 * Pokémon Style Wheel Theme
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

    // Dynamic background particles
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; speed: number }[]>([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            speed: Math.random() * 0.5 + 0.2,
        }));
        setParticles(newParticles);
    }, []);

    // Draw Wheel
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50; // Leave room for frame

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- 1. Outer Frame (Tech Plastic) ---
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 40, 0, 2 * Math.PI);
        const frameGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        frameGradient.addColorStop(0, '#F0F0F0');
        frameGradient.addColorStop(0.5, '#D1D5DB');
        frameGradient.addColorStop(1, '#9CA3AF');
        ctx.fillStyle = frameGradient;
        ctx.fill();

        // Frame Rim (Blue Accent)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 35, 0, 2 * Math.PI);
        ctx.strokeStyle = '#3B4CCA'; // Pokémon Blue
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner Dark Ring (LED Background)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#1F2937';
        ctx.fill();

        // LED Lights
        const ledCount = 24;
        for (let i = 0; i < ledCount; i++) {
            const angle = (i * 2 * Math.PI) / ledCount;
            const lx = centerX + (radius + 20) * Math.cos(angle);
            const ly = centerY + (radius + 20) * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
            // Alternate colors or blinking effect could go here
            ctx.fillStyle = i % 2 === 0 ? '#FEF08A' : '#60A5FA';
            ctx.shadowColor = i % 2 === 0 ? '#FEF08A' : '#60A5FA';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow
        }

        // --- 2. Wheel Segments ---
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);

        const displayParticipants = participants.slice(0, 16); // Show up to 16
        const safeParticipants = displayParticipants.length > 0 ? displayParticipants : [{ id: 0, name: 'Waiting...' }];
        const segmentAngle = (2 * Math.PI) / safeParticipants.length;

        safeParticipants.forEach((participant, index) => {
            const startAngle = index * segmentAngle - Math.PI / 2;
            const endAngle = startAngle + segmentAngle;

            // Segment Shape
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
            // Gradient for 3D effect on segment
            const segGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            segGrad.addColorStop(0, color);
            segGrad.addColorStop(1, adjustColor(color, -20)); // Darker at edge

            ctx.fillStyle = segGrad;
            ctx.fill();

            // Segment Divider
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + segmentAngle / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif'; // Modern font
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 3;

            let displayName = participant.name;
            if (displayName.length > 8) displayName = displayName.slice(0, 8) + '..';

            ctx.fillText(displayName, radius - 30, 5);
            ctx.restore();
        });

        ctx.restore();

        // --- 3. Center Hub (Pokéball Style) ---
        // Outer white ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, 55, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Top Half (Red)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 48, Math.PI, 0); // Upper half
        ctx.fillStyle = '#EE1515';
        ctx.fill();

        // Bottom Half (White)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 48, 0, Math.PI); // Lower half
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Middle Black Strip
        ctx.beginPath();
        ctx.rect(centerX - 48, centerY - 5, 96, 10);
        ctx.fillStyle = '#222222';
        ctx.fill();

        // Frame for button
        ctx.beginPath();
        ctx.arc(centerX, centerY, 48, 0, 2 * Math.PI);
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Center Button (Inner Hub)
        ctx.beginPath();
        ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Glowing Core
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = spinning ? '#74C0FC' : '#E0E0E0'; // Blue glow when spinning
        if (spinning) {
            ctx.shadowColor = '#74C0FC';
            ctx.shadowBlur = 15;
        }
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // --- 4. Pointer (Tech Triangle) ---
        // Side pointer
        const pointerX = centerX + radius + 15;
        const pointerY = centerY;

        ctx.beginPath();
        ctx.moveTo(pointerX, pointerY - 15);
        ctx.lineTo(pointerX - 40, pointerY); // Pointing inward
        ctx.lineTo(pointerX, pointerY + 15);
        ctx.closePath();
        ctx.fillStyle = '#DC2626'; // Red
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

    }, [rotation, participants, spinning]);

    const startSpin = async () => {
        if (spinning || isDrawing || participants.length === 0) return;

        setSpinning(true);

        const spins = 5 + Math.random() * 3;
        const totalRotation = spins * 360;
        const duration = 5000;
        const startTime = Date.now();
        const startRotation = rotation;

        // Easing: cubic-bezier-like (starts fast, slows down smoothly)
        const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);

            setRotation(startRotation + totalRotation * easedProgress);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setSpinning(false);
                onDraw();
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <div className="relative w-full min-h-screen overflow-hidden flex flex-col items-center justify-center font-sans">
            {/* Background: Futuristic Pokémon Center Terminal */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 z-0">
                {/* Grid Overlay */}
                <div
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Floating Particles */}
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="absolute rounded-full bg-blue-400 opacity-30 animate-pulse"
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            animationDuration: `${3 / p.speed}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 scale-90 md:scale-100">

                {/* Header Badge */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-8 py-2 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <h1 className="text-2xl font-bold text-white tracking-widest uppercase drop-shadow-md">
                        <span className="text-yellow-400">LOTTERY</span> TERMINAL
                    </h1>
                </div>

                {/* Wheel Container */}
                <div className="relative group">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 rounded-full bg-blue-500 blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={600}
                        className="relative z-10 drop-shadow-2xl cursor-pointer"
                        onClick={startSpin}
                    />

                    {/* Center Action Button (Invisible transparent overlay for interaction if needed, though canvas handles drawing) */}
                    <button
                        onClick={startSpin}
                        disabled={spinning || isDrawing || participants.length === 0}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                         w-[96px] h-[96px] rounded-full z-20 opacity-0 cursor-pointer
                         disabled:cursor-not-allowed"
                        aria-label="Spin"
                    />
                </div>

                {/* Stats Panel (Nintendo Style UI) */}
                <div className="flex gap-6 mt-4">
                    <div className="group relative bg-white rounded-2xl p-4 min-w-[120px] shadow-lg border-b-4 border-gray-300 active:border-b-0 active:translate-y-1 transition-all">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Participants</div>
                        <div className="text-2xl font-black text-gray-800 tabular-nums">
                            {participants.length}
                        </div>
                        <div className="absolute top-0 right-0 p-2 text-blue-500">
                            👨‍👩‍👧‍👦
                        </div>
                    </div>

                    <div className="group relative bg-white rounded-2xl p-4 min-w-[120px] shadow-lg border-b-4 border-gray-300 active:border-b-0 active:translate-y-1 transition-all">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">To Draw</div>
                        <div className="text-2xl font-black text-gray-800 tabular-nums">
                            {drawCount}
                        </div>
                        <div className="absolute top-0 right-0 p-2 text-orange-500">
                            🎲
                        </div>
                    </div>
                </div>

                {/* Winner Popup / Display */}
                {winners.length > 0 && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
                        <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full mx-4 shadow-[0_0_50px_rgba(255,255,0,0.3)] border-4 border-yellow-400 transform scale-100 animate-[bounceIn_0.5s_cubic-bezier(0.68,-0.55,0.265,1.55)]">
                            <div className="text-center mb-6">
                                <h3 className="text-3xl font-black text-gray-800 uppercase tracking-widest">
                                    <span className="text-yellow-500">★</span> WINNER FOUND! <span className="text-yellow-500">★</span>
                                </h3>
                                <p className="text-gray-500 mt-2">The following trainer(s) have been selected:</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {winners.map((winner, idx) => (
                                    <div
                                        key={winner.id}
                                        className="relative bg-gray-50 rounded-xl p-4 border-2 border-gray-200 
                                                   flex flex-col items-center gap-2 overflow-hidden
                                                   hover:border-blue-500 transition-colors duration-300"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                                            {winner.name[0]}
                                        </div>
                                        <div className="font-bold text-gray-800 text-lg truncate w-full text-center">
                                            {winner.name}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            ID: #{String(winner.id).padStart(4, '0')}
                                        </div>

                                        {/* "New" Badge */}
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => {/* Currently no close action passed, maybe clear winners locally or rely on parent reset */ }}
                                className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all"
                            >
                                CONTINUE
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
