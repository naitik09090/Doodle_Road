import React, { useRef, useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const WIDTH = 1200;
const HEIGHT = 600;

// LEVEL CONFIGURATIONS
// const LEVEL_CONFIGS = [
//     { level: 1, name: 'Easy Start', carStart: { x: 150, y: HEIGHT / 2 }, finishPos: { x: WIDTH - 100, y: HEIGHT / 2 }, playSpeed: 150, bgColor: '#fff9f0', gridColor: 'rgba(255, 180, 150, 0.15)', pathColor: '#ff6b6b', carColor: '#ff4c5b' },
//     { level: 2, name: 'Curve Master', carStart: { x: 150, y: HEIGHT / 3 }, finishPos: { x: WIDTH - 100, y: (HEIGHT * 2) / 3 }, playSpeed: 170, bgColor: '#f0f9ff', gridColor: 'rgba(150, 200, 255, 0.15)', pathColor: '#4c9aff', carColor: '#2196F3' },
//     { level: 3, name: 'Speed Up', carStart: { x: 100, y: HEIGHT / 2 }, finishPos: { x: WIDTH - 80, y: HEIGHT / 2 }, playSpeed: 200, bgColor: '#f0fff4', gridColor: 'rgba(150, 255, 180, 0.15)', pathColor: '#48bb78', carColor: '#38a169' },
//     { level: 4, name: 'Zigzag', carStart: { x: 150, y: 100 }, finishPos: { x: WIDTH - 100, y: HEIGHT - 100 }, playSpeed: 180, bgColor: '#fffaf0', gridColor: 'rgba(255, 200, 100, 0.15)', pathColor: '#ed8936', carColor: '#dd6b20' },
//     { level: 5, name: 'Challenge', carStart: { x: 120, y: HEIGHT - 120 }, finishPos: { x: WIDTH - 120, y: 120 }, playSpeed: 220, bgColor: '#faf5ff', gridColor: 'rgba(200, 150, 255, 0.15)', pathColor: '#9f7aea', carColor: '#805ad5' },
//     { level: 6, name: 'Expert Path', carStart: { x: 180, y: HEIGHT / 4 }, finishPos: { x: WIDTH - 150, y: (HEIGHT * 3) / 4 }, playSpeed: 240, bgColor: '#fff5f7', gridColor: 'rgba(255, 150, 180, 0.15)', pathColor: '#ed64a6', carColor: '#d53f8c' },
//     { level: 7, name: 'Turbo Mode', carStart: { x: 100, y: HEIGHT / 2 }, finishPos: { x: WIDTH - 100, y: HEIGHT / 2 }, playSpeed: 280, bgColor: '#f0fdfa', gridColor: 'rgba(100, 220, 200, 0.15)', pathColor: '#38b2ac', carColor: '#319795' },
//     { level: 8, name: 'Spiral', carStart: { x: WIDTH / 2, y: 100 }, finishPos: { x: WIDTH / 2, y: HEIGHT - 100 }, playSpeed: 190, bgColor: '#fffbeb', gridColor: 'rgba(250, 200, 100, 0.15)', pathColor: '#f6ad55', carColor: '#ed8936' },
//     { level: 9, name: 'Master', carStart: { x: 100, y: 150 }, finishPos: { x: WIDTH - 100, y: HEIGHT - 150 }, playSpeed: 260, bgColor: '#f5f3ff', gridColor: 'rgba(180, 150, 255, 0.15)', pathColor: '#7c3aed', carColor: '#6d28d9' },
//     { level: 10, name: 'ULTIMATE', carStart: { x: 150, y: HEIGHT / 2 }, finishPos: { x: WIDTH - 150, y: HEIGHT / 2 }, playSpeed: 320, bgColor: '#fef2f2', gridColor: 'rgba(255, 100, 100, 0.15)', pathColor: '#dc2626', carColor: '#b91c1c' },
// ];

function drawObstacles(ctx, obstacles) {
    ctx.fillStyle = '#383838ff';
    for (let o of obstacles) {
        ctx.fillRect(o.x, o.y, o.w, o.h);
    }
}

const LEVEL_CONFIGS = [
    {
        level: 1,
        name: 'Easy Start',
        carStart: { x: 150, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 150,
        bgColor: '#fff9f0',
        gridColor: 'rgba(255, 180, 150, 0.15)',
        pathColor: '#ff6b6b',
        carColor: '#ff4c5b',
        obstacles: [
            { x: 500, y: 255, w: 40, h: 40 },
            { x: 500, y: 210, w: 40, h: 40 },
            { x: 500, y: 300, w: 40, h: 40 },
        ]
    },
    {
        level: 2,
        name: 'Curve Master',
        carStart: { x: 150, y: HEIGHT / 2.2 },
        finishPos: { x: WIDTH - 100, y: HEIGHT / 2.2 },
        playSpeed: 170,
        bgColor: '#f0f9ff',
        gridColor: 'rgba(150, 200, 255, 0.15)',
        pathColor: '#4c9aff',
        carColor: '#2196F3',
        obstacles: [
            { x: 600, y: 255, w: 40, h: 40 },
            { x: 600, y: 210, w: 40, h: 40 },
            { x: 600, y: 300, w: 40, h: 40 },
        ]
    },
    {
        level: 3,
        name: 'Box Avoider',
        carStart: { x: 100, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 80, y: HEIGHT / 2 },
        playSpeed: 200,
        bgColor: '#f0fff4',
        gridColor: 'rgba(150, 255, 180, 0.15)',
        pathColor: '#def50cff',
        carColor: '#000c06ff',
        obstacles: [
            { x: 500, y: 250, w: 80, h: 80 },
        ]
    },
    {
        level: 4,
        name: 'Zigzag',
        carStart: { x: 150, y: 100 },
        finishPos: { x: WIDTH - 100, y: HEIGHT - 100 },
        playSpeed: 180,
        bgColor: '#fffaf0',
        gridColor: 'rgba(255, 200, 100, 0.15)',
        pathColor: '#ed8936',
        carColor: '#dd6b20',
        obstacles: [
            { x: 300, y: 200, w: 60, h: 60 },
            { x: 700, y: 350, w: 60, h: 60 }
        ]
    },
    {
        level: 5,
        name: 'Challenge',
        carStart: { x: 120, y: HEIGHT - 120 },
        finishPos: { x: WIDTH - 120, y: 120 },
        playSpeed: 220,
        bgColor: '#faf5ff',
        gridColor: 'rgba(200, 150, 255, 0.15)',
        pathColor: '#9f7aea',
        carColor: '#805ad5',
        obstacles: [
            { x: 350, y: 0, w: 40, h: 40 },
            { x: 350, y: 50, w: 40, h: 40 },
            { x: 350, y: 100, w: 40, h: 40 },
            { x: 350, y: 150, w: 40, h: 40 },
            { x: 350, y: 200, w: 40, h: 40 },

            { x: 550, y: 200, w: 40, h: 40 },
            { x: 550, y: 250, w: 40, h: 40 },
            { x: 550, y: 300, w: 40, h: 40 },
            { x: 550, y: 350, w: 40, h: 40 },
            { x: 550, y: 400, w: 40, h: 40 },

            { x: 750, y: 0, w: 40, h: 40 },
            { x: 750, y: 50, w: 40, h: 40 },
            { x: 750, y: 100, w: 40, h: 40 },
            { x: 750, y: 150, w: 40, h: 40 },
            { x: 750, y: 200, w: 40, h: 40 },
        ]
    },

    // ⭐ NEW LEVELS BELOW ⭐

    {
        level: 6,
        name: 'Moving Box',
        carStart: { x: 150, y: 150 },
        finishPos: { x: WIDTH - 200, y: HEIGHT - 150 },
        playSpeed: 200,
        bgColor: '#fef7f7',
        gridColor: 'rgba(255, 140, 150, 0.15)',
        pathColor: '#ef476f',
        carColor: '#d90429',
        obstacles: [
            { x: 400, y: 180, w: 70, h: 70, moving: true, dx: 2 }
        ]
    },
    {
        level: 7,
        name: 'Narrow Tunnel',
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 100, y: HEIGHT / 2 },
        playSpeed: 260,
        bgColor: '#e8faff',
        gridColor: 'rgba(130,180,255,0.2)',
        pathColor: '#0077b6',
        carColor: '#023e8a',
        obstacles: [
            { x: 350, y: 150, w: 40, h: 300 },
            { x: 750, y: 150, w: 40, h: 300 }
        ]
    },
    {
        level: 8,
        name: 'Box Maze',
        carStart: { x: 180, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 180, y: HEIGHT / 2 },
        playSpeed: 200,
        bgColor: '#fffce8',
        gridColor: 'rgba(250,200,80,0.15)',
        pathColor: '#f6c23e',
        carColor: '#d69e2e',
        obstacles: [
            { x: 300, y: 180, w: 100, h: 100 },
            { x: 500, y: 300, w: 120, h: 80 },
            { x: 750, y: 200, w: 100, h: 120 }
        ]
    },
    {
        level: 9,
        name: 'Box Gauntlet',
        carStart: { x: 150, y: HEIGHT / 3 },
        finishPos: { x: WIDTH - 300, y: HEIGHT / 1.5 },
        playSpeed: 150,
        bgColor: '#f3f0ff',
        gridColor: 'rgba(180,140,255,0.15)',
        pathColor: '#7f00ff',
        carColor: '#5a00d1',
        obstacles: [
            { x: 110, y: 220, w: 40, h: 40 },
            { x: 153, y: 220, w: 40, h: 40 },
            { x: 196, y: 220, w: 40, h: 40 },
            { x: 239, y: 220, w: 40, h: 40 },
            { x: 282, y: 220, w: 40, h: 40 },
            { x: 325, y: 220, w: 40, h: 40 },
            { x: 368, y: 220, w: 40, h: 40 },
            { x: 411, y: 220, w: 40, h: 40 },

            { x: 411, y: 263, w: 40, h: 40 },
            { x: 411, y: 306, w: 40, h: 40 },
            { x: 411, y: 349, w: 40, h: 40 },
            { x: 411, y: 393, w: 40, h: 40 },
            { x: 411, y: 436, w: 40, h: 40 },

            { x: 455, y: 436, w: 40, h: 40 },
            { x: 498, y: 436, w: 40, h: 40 },
            { x: 541, y: 436, w: 40, h: 40 },
            { x: 584, y: 436, w: 40, h: 40 },
            { x: 627, y: 436, w: 40, h: 40 },
            { x: 670, y: 436, w: 40, h: 40 },
            { x: 714, y: 436, w: 40, h: 40 },
            { x: 757, y: 436, w: 40, h: 40 },
            { x: 800, y: 436, w: 40, h: 40 },
            { x: 843, y: 436, w: 40, h: 40 },
            { x: 887, y: 436, w: 40, h: 40 },
            { x: 930, y: 436, w: 40, h: 40 },
        ]
    },
    {
        level: 10,
        name: 'ULTRA BOX HELL',
        carStart: { x: 150, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 350,
        bgColor: '#fff1f1',
        gridColor: 'rgba(255,80,80,0.2)',
        pathColor: '#c1121f',
        carColor: '#780000',
        obstacles: [
            { x: 300, y: 200, w: 80, h: 80 },
            { x: 500, y: 120, w: 80, h: 80 },
            { x: 600, y: 350, w: 80, h: 80 },
            { x: 850, y: 250, w: 80, h: 80 }
        ]
    }
];


function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    ctx.lineTo(x + w, y + h - r.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    ctx.lineTo(x + r.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function drawCheckeredFlag(ctx, cx, cy, size = 44) {
    const squares = 5;
    const squareSize = size / squares;
    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);
    for (let row = 0; row < squares; row++) {
        for (let col = 0; col < squares; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#000' : '#fff';
            ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
        }
    }
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);
    ctx.restore();
}

export default function DoodleRoadGame() {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const stateRef = useRef({});
    const finishAlertShown = useRef(false);

    const [mode, setMode] = useState('draw');
    const [score, setScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [showNextLevel, setShowNextLevel] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    // const [showLevelSelect, setShowLevelSelect] = useState(false);
    const [totalStars, setTotalStars] = useState(0);
    const [levelStars, setLevelStars] = useState(0);
    const [levelCompleted, setLevelCompleted] = useState(false);

    const currentConfig = LEVEL_CONFIGS[currentLevel - 1];

    useEffect(() => {
        const config = LEVEL_CONFIGS[currentLevel - 1];
        stateRef.current = {
            isDrawing: false, path: [], car: { x: config.carStart.x, y: config.carStart.y, w: 46, h: 30, angle: 0, finished: false, falling: false, fallSpeed: 0 },
            finish: { x: config.finishPos.x, y: config.finishPos.y, w: 44, h: 44 }, playProgress: 0, playSpeed: config.playSpeed, playing: false, lastTime: 0, sideMoveTime: 0, startTime: 0
        };
        finishAlertShown.current = false;
        setScore(0);
        setShowNextLevel(false);
        setGameStarted(false);
        setLevelStars(0);
        setLevelCompleted(false);
    }, [currentLevel]);

    function drawCar(ctx, cx, cy, angle = 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = currentConfig.carColor;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        roundRect(ctx, -23, -12, 46, 24, 6, true, false);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#cde7ff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(-12, -8, 24, 10);
        ctx.strokeRect(-12, -8, 24, 10);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-12, 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(12, 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    function drawGrid(ctx) {
        ctx.strokeStyle = currentConfig.gridColor;
        ctx.lineWidth = 1;
        const gap = 35;
        for (let x = 0; x < WIDTH; x += gap) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < HEIGHT; y += gap) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WIDTH, y);
            ctx.stroke();
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const getRect = () => canvas.getBoundingClientRect();
        const toLocal = (e) => {
            const r = getRect();
            if (e.touches) e = e.touches[0];
            return { x: (e.clientX - r.left) * (WIDTH / r.width), y: (e.clientY - r.top) * (HEIGHT / r.height) };
        };
        const s = stateRef.current;
        function down(e) {
            if (mode !== 'draw' || s.playing) return;
            e.preventDefault();
            s.isDrawing = true;
            s.path.push(toLocal(e));
        }
        function move(e) {
            if (!s.isDrawing || mode !== 'draw' || s.playing) return;
            e.preventDefault();
            const p = toLocal(e);
            const last = s.path[s.path.length - 1];
            if (!last || dist(last, p) > 6) s.path.push(p);
        }
        function up() { s.isDrawing = false; }
        canvas.addEventListener('mousedown', down);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        canvas.addEventListener('touchstart', down, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', up);
        return () => {
            canvas.removeEventListener('mousedown', down);
            canvas.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
            canvas.removeEventListener('touchstart', down);
            canvas.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, [mode]);

    // Helper: obstacles એ currentConfig.obstacles છે કે જે તમે drawObstacles પાસ કરી રહ્યા છોઅ
    function getTopObstacleUnderCar(car, obstacles) {
        // Return the highest (smallest y) obstacle directly under the car's x-range, else null
        const carLeft = car.x;
        const carRight = car.x + car.w;
        let candidate = null;
        for (const o of obstacles) {
            const obsLeft = o.x;
            const obsRight = o.x + o.w;
            // check horizontal overlap
            const overlap = !(carRight <= obsLeft || carLeft >= obsRight);
            if (!overlap) continue;
            // obstacle is horizontally beneath the car — consider it
            if (candidate === null || o.y < candidate.y) {
                candidate = o;
            }
        }
        return candidate;
    }


    const startPlay = useCallback(() => {
        const s = stateRef.current;
        const obs = currentConfig.obstacles;

        // ensure car sits on top of obstacle or ground when starting
        const under = getTopObstacleUnderCar(s.car, obs);
        const groundY = under ? under.y : (HEIGHT - 40);
        s.car.y = groundY - s.car.h;
        s.car.falling = false;
        s.car.fallSpeed = 0;

        // --- NEW: prepend an anchor so the car starts from its current position ---
        // Only if the drawn path has at least two points (angle can be computed)
        if (s.path && s.path.length >= 2) {
            const a = s.path[0], b = s.path[0];
            // const angle = Math.atan2(b.y - a.y, b.x - a.x);
            // const CAR_OFFSET = 0; // match loop
            // const oX = -Math.sin(angle) * CAR_OFFSET;
            // const oY = Math.cos(angle) * CAR_OFFSET;
            const anchor = { x: s.car.x - a, y: s.car.y - b };
            if (dist(s.path[0], anchor) > 1) s.path.unshift(anchor);
        }else if (s.path && s.path.length === 1) {
            // if only one point, duplicate it to allow car to start
            s.path.unshift({ x: s.path[0].x, y: s.path[0].y });

    } else if (!s.path || s.path.length === 0) {
        // if no path drawn, keep path empty and don't start playing
        // you may optionally show a message instead of auto-start
    }

    s.playing = true;
    s.playProgress = 0;
    s.car.finished = false;

    s.startTime = Date.now();
    finishAlertShown.current = false;
    setMode('play');
    setGameStarted(true);
    setShowNextLevel(false);
    setLevelCompleted(false);

    if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(loop);
    }
}, [currentConfig]);



function followPath(progress, path) {
    if (path.length < 2) return null;
    let p = progress;
    for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1], L = dist(a, b);
        if (p <= L) {
            const t = p / L;
            const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            return { x, y, angle };
        }
        p -= L;
    }
    return null;
}

function aabb(a, b) {
    return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

function loop(ts) {
    const s = stateRef.current;
    if (!s.lastTime) s.lastTime = ts;
    const dt = (ts - s.lastTime) / 1000;
    s.lastTime = ts;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (s.playing && !s.car.finished) {
        s.playProgress += s.playSpeed * dt;
        const pos = followPath(s.playProgress, s.path);
        if (pos) {
            const CAR_OFFSET = -22;
            const oX = -Math.sin(pos.angle) * CAR_OFFSET;
            const oY = Math.cos(pos.angle) * CAR_OFFSET;

            s.car.x = pos.x + oX;
            s.car.y = pos.y + oY;
            s.car.angle = pos.angle;
        } else {
            s.car.finished = true;
            s.car.falling = true;
        }
        const carRect = { x: s.car.x - s.car.w / 2, y: s.car.y - s.car.h / 2, w: s.car.w, h: s.car.h };
        const f = s.finish;
        const fRect = { x: f.x - f.w / 2, y: f.y - f.h / 2, w: f.w, h: f.h };
        // Obstacle collision check
        for (let box of currentConfig.obstacles) {
            const carRect = {
                x: s.car.x,
                y: s.car.y,
                w: s.car.w,
                h: s.car.h
            };

            const boxRect = {
                x: box.x,
                y: box.y,
                w: box.w,
                h: box.h
            };

            if (aabb(carRect, boxRect)) {

                // check if car is falling onto the top of the block
                if (s.car.y + s.car.h - s.car.vy <= box.y) {

                    // place car on block
                    s.car.y = box.y - s.car.h;

                    // stop falling
                    s.car.vy = 0;
                    s.car.falling = false;
                }
            }
        }


        if (aabb(carRect, fRect) && !finishAlertShown.current) {
            finishAlertShown.current = true;

            // Calculate stars based on time and path efficiency
            const completionTime = (Date.now() - s.startTime) / 1000;
            const pathLength = s.path.reduce((total, point, i) => {
                if (i === 0) return 0;
                return total + dist(s.path[i - 1], point);
            }, 0);

            // Calculate optimal path length (straight line)
            const optimalLength = dist(
                { x: currentConfig.carStart.x, y: currentConfig.carStart.y },
                { x: currentConfig.finishPos.x, y: currentConfig.finishPos.y }
            );

            const efficiency = optimalLength / pathLength;

            // Star calculation: 3 stars for fast and efficient, 2 for moderate, 1 for completion
            let stars = 1;
            if (completionTime < 5 && efficiency > 0.8) stars = 3;
            else if (completionTime < 8 && efficiency > 0.6) stars = 2;

            setLevelStars(stars);
            setTotalStars(prev => prev + stars - 1);
            setLevelCompleted(true);
            setTimeout(() => {
                setShowNextLevel(true);
            }, 100);
        }
        setScore(Math.floor(s.playProgress / 5));
    }
    if (s.car.falling && s.car.y < HEIGHT + 50) {
        s.car.y += s.car.fallSpeed;
        s.car.fallSpeed += 0.5;
        s.car.angle += 0.05;
    }
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = currentConfig.bgColor;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawGrid(ctx);
    drawObstacles(ctx, currentConfig.obstacles);  // <-- ADD THIS

    if (s.path.length > 1) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.lineWidth = 5;
        ctx.strokeStyle = currentConfig.pathColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(s.path[0].x, s.path[0].y);
        for (let p of s.path) ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
    drawCheckeredFlag(ctx, s.finish.x, s.finish.y, s.finish.w);
    if (s.car.y < HEIGHT + 50) drawCar(ctx, s.car.x, s.car.y, s.car.angle);
    rafRef.current = requestAnimationFrame(loop);
}

useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = currentConfig.bgColor;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawGrid(ctx);
    const s = stateRef.current;
    drawCheckeredFlag(ctx, s.finish.x, s.finish.y, s.finish.w);
    drawCar(ctx, s.car.x, s.car.y, s.car.angle);
    if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    return () => {
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
}, [currentLevel]);

const restartLevel = () => {
    const config = LEVEL_CONFIGS[currentLevel - 1], s = stateRef.current;
    s.path = []; s.playing = false; s.playProgress = 0;
    s.car.x = config.carStart.x; s.car.y = config.carStart.y; s.car.angle = 0;
    s.car.finished = false; s.car.falling = false; s.car.fallSpeed = 0;
    finishAlertShown.current = false;
    setScore(0); setMode('draw'); setShowNextLevel(false); setGameStarted(false);
    setLevelCompleted(false);
};

const goToNextLevel = () => {
    if (currentLevel < 10) setCurrentLevel((prev) => prev + 1);
    else alert('🏆 Congratulations! You completed all levels!');
    setMode('draw');
};

// const selectLevel = (level) => {
//     setCurrentLevel(level);
//     setShowLevelSelect(false);
// };

return (
    <div className="game-container">
        <div className="container py-4">
            <div className="game-card">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div>
                        <h1 className="game-title mb-1" data-testid="level-title">Level {currentLevel}</h1>
                        <span className="level-subtitle">{currentConfig.name}</span>
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                        <div className="score-badge" data-testid="score-display">
                            <span className="star-icon">★</span>
                            <span>{score}</span>
                        </div>
                        <div className="total-stars-badge" data-testid="total-stars">
                            <span className="trophy-icon">🏆</span>
                            <span>{totalStars}</span>
                        </div>
                    </div>
                </div>

                <div className="canvas-wrapper mb-4">
                    <canvas ref={canvasRef} data-testid="game-canvas" />
                </div>

                {/* {showLevelSelect && (
                        <div className="modal-backdrop" data-testid="level-selector" onClick={() => setShowLevelSelect(false)}>
                            <div className="level-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h2 className="modal-title">Select Level</h2>
                                    <button className="btn-close-modal" onClick={() => setShowLevelSelect(false)} data-testid="close-level-selector">×</button>
                                </div>
                                <div className="row g-3">
                                    {LEVEL_CONFIGS.map((config) => (
                                        <div key={config.level} className="col-6 col-md-4 col-lg-3">
                                            <button
                                                className={`level-btn ${currentLevel === config.level ? 'active' : ''}`}
                                                onClick={() => selectLevel(config.level)}
                                                data-testid={`level-${config.level}-btn`}
                                                style={{ background: `linear-gradient(135deg, ${config.bgColor}, ${config.pathColor}33)`, borderColor: config.pathColor }}
                                            >
                                                <div className="level-num">{config.level}</div>
                                                <div className="level-label">{config.name}</div>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )} */}

                {/* {levelCompleted && (
                        <div className="level-complete-overlay" data-testid="level-complete">
                            <div className="completion-card">
                                <h2 className="completion-title">🎉 Level Complete!</h2>
                                <div className="stars-earned">
                                    {[1, 2, 3].map((star) => (
                                        <span key={star} className={`star-display ${star <= levelStars ? 'earned' : 'empty'}`}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <p className="stars-text">You earned {levelStars} star{levelStars !== 1 ? 's' : ''}!</p>
                                <p className="total-text">Total Stars: {totalStars}</p>
                            </div >
                        </div >
                    )
                    } */}

                {
                    !gameStarted ? (
                        <div className="d-flex gap-2 justify-content-center flex-wrap">
                            {/* <button onClick={() => setShowLevelSelect(true)} className="btn btn-primary btn-game" data-testid="select-level-btn">Levels</button> */}
                            <button onClick={() => setMode('draw')} className={`btn btn-info btn-game ${mode === 'draw' ? 'active' : ''}`} data-testid="draw-btn">Draw</button>
                            <button onClick={startPlay} className="btn btn-success btn-game" data-testid="start-btn">Start</button>
                            <button onClick={restartLevel} className="btn btn-danger btn-game" data-testid="clear-btn">Clear</button>
                        </div>
                    ) : (
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-2">
                                <button onClick={restartLevel} className="btn btn-icon" title="Restart" data-testid="restart-btn">🔄</button>
                                <button onClick={restartLevel} className="btn btn-icon" title="Eraser" data-testid="eraser-btn">✏️</button>
                            </div>
                            {showNextLevel && (
                                <button onClick={goToNextLevel} className="btn btn-next" data-testid="next-level-btn">
                                    {currentLevel < 10 ? 'NEXT LEVEL ▶' : '🏆 COMPLETED!'}
                                </button>
                            )}
                        </div>
                    )
                }
            </div >
        </div >
    </div >
);
}
