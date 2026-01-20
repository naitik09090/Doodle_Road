// DoodleRoad_React_Game.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

const WIDTH = 1200;
const HEIGHT = 600;

// function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dist(a, b) { const dx = a.x - b.x, dy = a.y - b.y; return Math.hypot(dx, dy); }
// function randRange(a, b) { return a + Math.random() * (b - a); }

export default function DoodleRoadGame() {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const stateRef = useRef({});

    const [mode, setMode] = useState('draw'); // menu | draw | cut | play
    const [score, setScore] = useState(0);
    const [message, setMessage] = useState('');

    const btnStyle = { padding: '10px 16px', fontSize: 16, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', background: '#2f80ed', cursor: 'pointer' };

    useEffect(() => {
        stateRef.current = {
            isDrawing: false,
            path: [],
            car: { x: 80, y: HEIGHT / 2 - 120, vx: 0, w: 46, h: 30, angle: 0 },
            playing: false,
            playProgress: 0,
            playTotalLen: 0,
            playSpeed: 90,
            approachSpeed: 100,
            obstacles: [],
            finish: null,
            lastTime: 0,
            eraserRadius: 18,
            buttonRegions: [],
            preMove: false,
            preTarget: null,
            preSpeed: 60
        };

        // initialize static level blocks (no vy) — stacked with no gap
        const s = stateRef.current;
        s.obstacles = [];
        const blockW = 50;
        const blockH = 36;
        const leftX = 300;
        const midX = Math.round(WIDTH / 2);
        const rightX = WIDTH - 300;
        const leftStart = 60;
        const midStart = 200;
        const rightStart = 60;

        for (let i = 0; i < 5; i++) s.obstacles.push({ x: leftX, y: leftStart + i * (blockH), w: blockW, h: blockH });
        for (let i = 0; i < 6; i++) s.obstacles.push({ x: midX, y: midStart + i * (blockH ), w: blockW, h: blockH });
        for (let i = 0; i < 5; i++) s.obstacles.push({ x: rightX, y: rightStart + i * (blockH ), w: blockW, h: blockH });

        s.finish = { x: WIDTH - 120, y: 250, w: 44, h: 44 };
    }, []);

    // add point (sparse)
    const addPathPoint = p => { const s = stateRef.current; const last = s.path[s.path.length - 1]; if (!last || dist(last, p) > 6) s.path.push(p); };

    // pointer handlers
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const getRect = () => canvas.getBoundingClientRect();
        function toLocal(e) { const r = getRect(); if (e.touches) e = e.touches[0]; return { x: ((e.clientX - r.left) * (WIDTH / r.width)), y: ((e.clientY - r.top) * (HEIGHT / r.height)) }; }
        function down(e) { if (!(mode === 'draw' || mode === 'cut')) return; e.preventDefault(); const s = stateRef.current; s.isDrawing = true; const p = toLocal(e); if (mode === 'draw') addPathPoint(p); else s.path = s.path.filter(pt => dist(pt, p) > s.eraserRadius); lastPointer.x = p.x; lastPointer.y = p.y; }
        function move(e) { const s = stateRef.current; if (!s.isDrawing) return; const p = toLocal(e); if (mode === 'draw') addPathPoint(p); else s.path = s.path.filter(pt => dist(pt, p) > s.eraserRadius); lastPointer.x = p.x; lastPointer.y = p.y; }
        function up() { stateRef.current.isDrawing = false; }
        canvas.addEventListener('mousedown', down); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
        canvas.addEventListener('touchstart', down, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', up);
        return () => { canvas.removeEventListener('mousedown', down); canvas.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); canvas.removeEventListener('touchstart', down); canvas.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
    }, [mode]);

    // Replace your existing startPlay with this version:
    const startPlay = useCallback(() => {
        const s = stateRef.current;
        if (s.path.length < 4) {
            setMessage('Draw a continuous line first (left -> right).');
            setMode('draw');
            if (!rafRef.current) rafRef.current = requestAnimationFrame();
            return;
        }

        // compute segment lengths & cumulative lengths
        const segLens = [];
        const cum = [0]; // cumulative length at each vertex
        let total = 0;
        for (let i = 0; i < s.path.length - 1; i++) {
            const a = s.path[i], b = s.path[i + 1];
            const L = Math.hypot(b.x - a.x, b.y - a.y);
            segLens.push(L);
            total += L;
            cum.push(total);
        }
        s.playSegLens = segLens;
        s.playTotalLen = total;
        s.playCum = cum;     // store cumulative lengths
        s.playProgress = 0;
        s.playing = false;
        s.lastTime = performance.now();
        setScore(0);
        setMessage('');

        // find nearest point on polyline to current car position
        const carPos = { x: s.car.x, y: s.car.y };
        let best = { dist: Infinity, segIndex: 0, t: 5, distAlong: 0 };

        for (let i = 0; i < s.path.length - 1; i++) {
            const A = s.path[i], B = s.path[i + 1];
            const vx = B.x - A.x, vy = B.y - A.y;
            const wx = carPos.x - A.x, wy = carPos.y - A.y;
            const L2 = vx * vx + vy * vy;
            const t = L2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / L2));
            const px = A.x + vx * t, py = A.y + vy * t;
            const d = Math.hypot(carPos.x - px, carPos.y - py);
            const distAlong = (s.playCum[i] || 0) + (s.playSegLens[i] || 0) * t;
            if (d < best.dist) best = { dist: d, segIndex: i, t, px, py, distAlong };
        }

        // if nearest point is very close, teleport car to it and start from there
        const TELEPORT_THRESHOLD = 4; // pixels
        if (best.dist <= TELEPORT_THRESHOLD) {
            s.car.x = best.px;
            s.car.y = best.py;

            // set initial play progress to the nearest location along the path
            s.playProgress = best.distAlong;

            // compute and set car angle to match local path direction
            const segA = s.path[best.segIndex];
            const segB = s.path[best.segIndex + 1] || segA;
            s.car.angle = Math.atan2(segB.y - segA.y, segB.x - segA.x);

            s.playing = true;
            setMode('play');
        } else {
            // otherwise approach that nearest point slowly, then follow the path from there
            s.preMove = true;
            s.preTarget = { x: best.px, y: best.py };
            s.preSpeed = s.approachSpeed;
            // record where to start along path after approach
            s._startAfterApproach = best.distAlong;
            setMode('play');
        }

        if (!rafRef.current) rafRef.current = requestAnimationFrame();
    }, []);


    // sample position along path by distance
    function sampleAlongPath(distAlong) {
        const s = stateRef.current; const pts = s.path; if (pts.length === 0) return { x: 0, y: 0, angle: 0 };
        let remaining = distAlong; for (let i = 0; i < s.playSegLens.length; i++) { const L = s.playSegLens[i]; if (remaining <= L) { const a = pts[i], b = pts[i + 1]; const t = L === 0 ? 0 : (remaining / L); const x = a.x + (b.x - a.x) * t; const y = a.y + (b.y - a.y) * t; const angle = Math.atan2(b.y - a.y, b.x - a.x); return { x, y, angle }; } remaining -= L; }
        const last = pts[pts.length - 1]; const prev = pts[pts.length - 2] || last; return { x: last.x, y: last.y, angle: Math.atan2(last.y - prev.y, last.x - prev.x) };
    }

    function aabb(a, b) { return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h); }

    // drawing helpers
    function drawGrid(ctx) { ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 0; const gap = 35; for (let x = 0; x < WIDTH; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); } for (let y = 0; y < HEIGHT; y += gap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); } ctx.restore(); }
    function roundRect(ctx, x, y, w, h, r, fill, stroke) { if (r === undefined) r = 4; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); if (fill) ctx.fill(); if (stroke) { ctx.strokeStyle = '#111'; ctx.lineWidth = 0; ctx.stroke(); } }
    function drawCar(ctx, cx, cy, angle = 0) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.fillStyle = '#ff4757'; roundRect(ctx, -23, -12, 46, 24, 6, true, false); ctx.fillStyle = '#cde7ff'; ctx.fillRect(-12, -8, 24, 10); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-12, 12, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(12, 12, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }

    const lastPointer = { x: 0, y: 0 };

    // MAIN LOOP
    function loop(ts) {
        const s = stateRef.current; if (!s.lastTime) s.lastTime = ts; const dt = Math.min(40, ts - s.lastTime); s.lastTime = ts; const dtSec = dt / 1000;

        // If preMove (approach) active -> move car toward start point
        if (s.preMove) {
            const target = s.preTarget; const dx = target.x - s.car.x; const dy = target.y - s.car.y; const distTo = Math.hypot(dx, dy);
            if (distTo < 6) {
                s.preMove = false; s.playing = true; // begin following path
            } else {
                const move = Math.min(s.preSpeed * dtSec, distTo);
                s.car.x += (dx / distTo) * move; s.car.y += (dy / distTo) * move;
                // rotate car toward movement vector
                s.car.angle = Math.atan2(dy, dx);
            }
        } else if (s.playing) {
            s.playProgress += s.playSpeed * dtSec;

            if (s.playProgress >= s.playTotalLen) {
                s.playing = false;
                setMessage('fail!');
                setMode('menu');
            } else {
                // move car along the path
                const pos = sampleAlongPath(s.playProgress);
                s.car.logicX = pos.x;
                s.car.logicY = pos.y;
                s.car.angle = pos.angle;

                // optional offset (remove if not needed)
                // car bottom show and top show
                const CAR_OFFSET = -13;
                const oX = -Math.sin(pos.angle) * CAR_OFFSET;
                const oY = Math.cos(pos.angle) * CAR_OFFSET;

                s.car.x = s.car.logicX + oX;
                s.car.y = s.car.logicY + oY;

                // ✅ FIX: define carRect (no undefined!)
                const carRect = {
                    x: s.car.x - s.car.w / 2,
                    y: s.car.y - s.car.h / 2,
                    w: s.car.w,
                    h: s.car.h
                };

                // obstacle collision
                for (let o of s.obstacles) {
                    const obRect = {
                        x: o.x - o.w / 2,
                        y: o.y - o.h / 2,
                        w: o.w,
                        h: o.h
                    };

                    if (aabb(carRect, obRect)) {
                        s.playing = false;
                        setMessage('Crash!');
                        setMode('menu');
                        break;
                    }
                }

                // finish line collision
                if (s.finish) {
                    const f = s.finish;
                    const fRect = {
                        x: f.x - f.w / 2,
                        y: f.y - f.h / 2,
                        w: f.w,
                        h: f.h
                    };

                    if (aabb(carRect, fRect)) {
                        s.playing = false;
                        setMessage('Finish!');
                        setMode('menu');
                    }
                }
            }

            setScore(Math.floor(s.playProgress / 5));
        }


        // <-- OBSERVATION: Previously you moved obstacles here (o.y += ...). That code is removed.
        // Obstacles are static — NO POSITION MUTATION below.

        // DRAW
        const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = '#fffefa'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
        const g = ctx.createLinearGradient(0, 0, 0, HEIGHT); g.addColorStop(0, 'rgba(0,0,0,0.02)'); g.addColorStop(1, 'rgba(0,0,0,0.04)'); ctx.fillStyle = g; ctx.fillRect(0, 0, WIDTH, HEIGHT);

        drawGrid(ctx);

        // draw obstacles (STATIC) — draw using correct centered Y (-o.h/2) so stacking matches positions
        for (let o of s.obstacles) {
            ctx.save();
            ctx.translate(o.x, o.y);
            ctx.fillStyle = '#98a0a8';
            roundRect(
                ctx,
                -o.w / 2,
                -o.h / 2,
                o.w,
                o.h,
                6,
                true,
                true
            );
            ctx.restore();
        }

        // draw path (thick doodle line)
        // SHOW PATH ONLY DURING PLAY
        const pth = s.path;
        if (mode === 'play' && pth.length > 0) {
            ctx.beginPath();
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#0b0b0b';
            ctx.lineCap = 'round';
            ctx.moveTo(pth[0].x, pth[0].y);
            for (let p of pth) ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }


        // draw finish
        if (s.finish) { const f = s.finish; ctx.save(); ctx.translate(f.x, f.y); const sW = f.w; const sH = f.h; const sz = 6; ctx.fillStyle = '#FF4757'; ctx.fillRect(-sW / 2, -sH / 2, sW, sH); ctx.fillStyle = '#000'; for (let xx = -sW / 2; xx < sW / 2; xx += sz) { for (let yy = -sH / 2; yy < sH / 2; yy += sz) { if (((xx + yy) / sz) % 2 === 0) ctx.fillRect(xx, yy, sz, sz); } } ctx.restore(); }

        // draw car
        drawCar(ctx, s.car.x, s.car.y, s.car.angle || 0);

        // show eraser/guide during draw/cut
        if (mode === 'draw' || mode === 'cut') {
            if (s.path.length > 0) { ctx.beginPath(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.moveTo(s.path[0].x, s.path[0].y); for (let p of s.path) ctx.lineTo(p.x, p.y); ctx.stroke(); }
            if (mode === 'cut') { ctx.beginPath(); ctx.fillStyle = 'rgba(255,0,0,0.12)'; ctx.arc(lastPointer.x, lastPointer.y, s.eraserRadius, 0, Math.PI * 2); ctx.fill(); }
        }

        drawUI(ctx);

        if (s.playing || mode === 'draw' || mode === 'cut' || s.preMove) rafRef.current = requestAnimationFrame(loop); else rafRef.current = null;
    }

    // UI draw
    function drawUI(ctx) {
        ctx.save();

        // Title
        ctx.font = '32px "Comic Sans MS", Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#111';
        ctx.fillText('Doodle Road — Level Preview', WIDTH / 2, 28);

        // Score
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`★ ${score}`, WIDTH - 38, 26);

        // Bottom text
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'left';
        // ctx.fillText(`Mode: ${mode}`, 14, HEIGHT - 36);

        ctx.restore();
    }


    // if (mode === 'menu') {
    //     const cardW = 600, cardH = 220; const cx = (WIDTH - cardW) / 2, cy = 90; ctx.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(ctx, cx, cy, cardW, cardH, 12, true, true);
    //     stateRef.current.buttonRegions = [];
    //     const bw = 200, bh = 56; const left = WIDTH / 2 - bw - 12; const right = WIDTH / 2 + 12; const top = cy + 18;
    //     drawMenuButton(ctx, left, top, bw, bh, 'DRAW', () => { setMode('draw'); if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); }, '#2ecc71');
    //     drawMenuButton(ctx, right, top, bw, bh, 'CUT', () => { setMode('cut'); if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); }, '#e67e22');
    //     drawMenuButton(ctx, WIDTH / 2 - 110, top + 90, 220, 64, 'START', () => startPlay(), '#27ae60');
    //     ctx.font = '16px sans-serif'; ctx.fillStyle = '#444'; ctx.textAlign = 'center'; ctx.fillText('Draw a line that goes around the blocks and reaches the finish. START will approach the line if needed.', WIDTH / 2, cy + cardH - 12);
    // }

    // function drawMenuButton(ctx, x, y, w, h, label, onClick, color) { const s = stateRef.current; if (!s.buttonRegions) s.buttonRegions = []; s.buttonRegions.push({ x, y, w, h, onClick }); ctx.save(); ctx.fillStyle = color; ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 12; roundRect(ctx, x, y, w, h, 10, true, true); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(label, x + w / 2, y + h / 2 + 7); ctx.restore(); }

    // canvas click handler
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return; function onClick(e) { const rect = canvas.getBoundingClientRect(); const mx = (e.clientX - rect.left) * (WIDTH / rect.width); const my = (e.clientY - rect.top) * (HEIGHT / rect.height); const s = stateRef.current; if (s.buttonRegions) { for (let b of s.buttonRegions) { if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) { b.onClick && b.onClick(); return; } } } if (message) setMessage(''); } canvas.addEventListener('click', onClick); return () => canvas.removeEventListener('click', onClick);
    }, [message, startPlay]);

    useEffect(() => { const canvas = canvasRef.current; if (!canvas) return; canvas.width = WIDTH; canvas.height = HEIGHT; canvas.style.width = '100%'; canvas.style.maxWidth = '100%'; if (!rafRef.current) rafRef.current = requestAnimationFrame(loop); return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; }; }, []);

    // controls under canvas
    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <div style={{ width: '100%', maxWidth: 1100 }}>
                <div style={{ position: 'relative', border: '6px solid #111', borderRadius: 12, overflow: 'hidden', background: '#fffefa' }}>
                    <canvas ref={canvasRef} style={{ display: 'block' }} />
                    <div style={{ position: 'absolute', right: 16, padding: 30, background: '#fff', borderRadius: 10, boxShadow: '0 6px 18px rgba(229, 233, 18, 1)', fontWeight: 700 }}>
                        ★ {score}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>

                    <button
                        onClick={() => {
                            setMode('draw');
                            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
                        }}
                        style={btnStyle}
                    >
                        Draw
                    </button>

                    <button
                        onClick={() => {
                            setMode('cut');
                            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
                        }}
                        style={btnStyle}
                    >
                        Cut
                    </button>

                    <button
                        onClick={() => {
                            startPlay();
                            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
                        }}
                        style={{ ...btnStyle, background: '#27ae60', color: '#fff' }}
                    >
                        Start
                    </button>

                    <button
                        onClick={() => {
                            stateRef.current.path = [];
                            setMessage('Cleared');
                            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
                        }}
                        style={btnStyle}
                    >
                        Clear
                    </button>

                    <button
                        onClick={() => {
                            const s = stateRef.current;
                            s.playing = false;
                            s.path = [];
                            setMode('menu');
                            setMessage('Reset');
                            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
                        }}
                        style={btnStyle}
                    >
                        Menu
                    </button>

                </div>
                <div style={{ marginTop: 10, textAlign: 'center', color: '#ca0000ff' }}>{message}</div>
            </div>
        </div>
    );
}
