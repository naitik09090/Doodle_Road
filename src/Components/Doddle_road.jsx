// DoodleRoad.jsx
import React, { useRef, useEffect, useState, useCallback } from "react";

const GAME_WIDTH = 480;
const GAME_HEIGHT = 800;

function randRange(a, b) {
    return a + Math.random() * (b - a);
}

function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

export default function DoodleRoad() {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);

    // Game refs (mutable for performance)
    const stateRef = useRef({
        isRunning: false,
        lastTime: 0,
        scrollSpeed: 250, // pixels per second
        player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 140, w: 36, h: 52, vx: 0 },
        road: {
            points: [], // array of {x, y}
            segmentHeight: 120,
            halfWidth: 120,
        },
        obstacles: [],
        score: 0,
        spawnTimer: 0,
    });

    // Local UI state
    const [score, setScore] = useState(0);
    const [running, setRunning] = useState(false);

    // Initialize road points
    const initRoad = useCallback(() => {
        const s = stateRef.current;
        s.road.points = [];
        const segH = s.road.segmentHeight;
        const centerX = GAME_WIDTH / 2;
        // fill points from -segH*4 to GAME_HEIGHT + segH
        for (let y = -segH * 4; y < GAME_HEIGHT + segH * 2; y += segH) {
            const jitter = randRange(-80, 80);
            s.road.points.push({ x: clamp(centerX + jitter, 80, GAME_WIDTH - 80), y });
        }
    }, []);

    // Start game
    const startGame = useCallback(() => {
        const s = stateRef.current;
        s.isRunning = true;
        s.lastTime = performance.now();
        s.scrollSpeed = 250;
        s.obstacles = [];
        s.score = 0;
        s.spawnTimer = 0;
        s.player.x = GAME_WIDTH / 2;
        initRoad();
        setScore(0);
        setRunning(true);
        // start loop
        if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    }, [initRoad]);

    // Stop game
    const stopGame = useCallback(() => {
        const s = stateRef.current;
        s.isRunning = false;
        setRunning(false);
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
    }, []);

    // Basic collision AABB
    function aabbOverlap(a, b) {
        return !(
            a.x + a.w < b.x ||
            a.x > b.x + b.w ||
            a.y + a.h < b.y ||
            a.y > b.y + b.h
        );
    }

    // Spawn obstacle at top following road center
    function spawnObstacle() {
        const s = stateRef.current;
        // choose a random segment near top (index 0..2)
        const topPts = s.road.points.slice(0, 4);
        const pick = topPts[Math.floor(Math.random() * topPts.length)];
        // place obstacle a bit above screen
        const ox = clamp(pick.x + randRange(-s.road.halfWidth + 20, s.road.halfWidth - 20), 20, GAME_WIDTH - 40);
        const oy = -60;
        const w = randRange(24, 56);
        const h = randRange(24, 56);
        s.obstacles.push({ x: ox - w / 2, y: oy, w, h, type: "rock" });
    }

    // Update function
    function update(dt) {
        const s = stateRef.current;
        if (!s.isRunning) return;

        // update score by distance traveled
        s.score += s.scrollSpeed * (dt / 1000) * 0.1;
        // update UI score occasionally
        if (Math.floor(s.score) !== score) setScore(Math.floor(s.score));

        // progressive difficulty
        s.scrollSpeed += dt * 0.01; // slightly increase speed over time

        // update player (apply velocity)
        // player.vx is set by input
        s.player.x += s.player.vx * (dt / 1000);
        // clamp to screen
        s.player.x = clamp(s.player.x, 20, GAME_WIDTH - 20);

        // scroll road points & obstacles downward
        const dy = s.scrollSpeed * (dt / 1000);
        for (let p of s.road.points) p.y += dy;
        for (let o of s.obstacles) o.y += dy;

        // remove off-screen road points and add new ones at top
        const segH = s.road.segmentHeight;
        while (s.road.points.length && s.road.points[0].y > GAME_HEIGHT + segH) {
            s.road.points.shift();
        }
        // ensure there are enough points above
        const last = s.road.points[s.road.points.length - 1];
        while (s.road.points.length < Math.ceil((GAME_HEIGHT + segH * 8) / segH)) {
            const newY = (s.road.points[s.road.points.length - 1].y - segH);
            // jitter but limit gradient
            const prevX = s.road.points[s.road.points.length - 1].x;
            const jitter = randRange(-80, 80);
            const newX = clamp(prevX + jitter, 80, GAME_WIDTH - 80);
            s.road.points.push({ x: newX, y: newY });
        }

        // spawn obstacles based on timer
        s.spawnTimer += dt;
        const spawnInterval = Math.max(700 - Math.floor(s.score / 10), 300); // ms
        if (s.spawnTimer > spawnInterval) {
            spawnObstacle();
            s.spawnTimer = 0;
        }

        // remove obstacles off screen
        s.obstacles = s.obstacles.filter(o => o.y < GAME_HEIGHT + 200);

        // collision
        for (let o of s.obstacles) {
            const rectA = { x: s.player.x - s.player.w / 2, y: s.player.y - s.player.h / 2, w: s.player.w, h: s.player.h };
            const rectB = { x: o.x, y: o.y, w: o.w, h: o.h };
            if (aabbOverlap(rectA, rectB)) {
                // collision! game over
                s.isRunning = false;
                setRunning(false);
                // stop RAF in next frame
            }
        }
    }

    // Draw function
    function draw(ctx) {
        const s = stateRef.current;
        // clear
        ctx.fillStyle = "#cfe9ff";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // draw road as polygon by computing left/right edges
        const points = s.road.points;
        if (points.length >= 2) {
            const left = [];
            const right = [];
            const half = s.road.halfWidth;
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                // estimate tangent for normal
                const next = points[Math.min(i + 1, points.length - 1)];
                const dx = next.x - p.x;
                const dy = next.y - p.y || 1;
                const len = Math.hypot(dx, dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                left.push({ x: p.x + nx * half, y: p.y + ny * half });
                right.push({ x: p.x - nx * half, y: p.y - ny * half });
            }

            // draw road fill
            ctx.beginPath();
            ctx.moveTo(left[0].x, left[0].y);
            for (let pt of left) ctx.lineTo(pt.x, pt.y);
            for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
            ctx.closePath();
            ctx.fillStyle = "#222";
            ctx.fill();

            // road edges
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#111";
            ctx.stroke();

            // dashed centerline
            ctx.setLineDash([18, 12]);
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#f3d86b";
            // draw center polyline
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let p of points) ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // draw obstacles
        for (let o of s.obstacles) {
            ctx.fillStyle = "#8b3e2f";
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.strokeStyle = "#5a2618";
            ctx.strokeRect(o.x, o.y, o.w, o.h);
        }

        // draw player (simple car)
        const px = s.player.x;
        const py = s.player.y;
        const pw = s.player.w;
        const ph = s.player.h;
        ctx.save();
        ctx.translate(px, py);
        ctx.fillStyle = "#ff4757";
        roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 6, true, true);
        // windows
        ctx.fillStyle = "#cde7ff";
        ctx.fillRect(-pw / 4, -ph / 4, pw / 2, ph / 4);
        ctx.restore();

        // UI
        ctx.fillStyle = "#000";
        ctx.font = "18px sans-serif";
        ctx.fillText(`Score: ${Math.floor(s.score)}`, 12, 26);

        if (!s.isRunning) {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(0, GAME_HEIGHT / 2 - 60, GAME_WIDTH, 120);
            ctx.fillStyle = "#fff";
            ctx.font = "28px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Game Over", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10);
            ctx.font = "18px sans-serif";
            ctx.fillText("Click to restart", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 22);
            ctx.textAlign = "start";
        }
    }

    // helper to draw rounded rect
    function roundRect(ctx, x, y, w, h, r, fill, stroke) {
        if (r === undefined) r = 5;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    // Main loop
    function loop(timestamp) {
        const s = stateRef.current;
        if (!s.lastTime) s.lastTime = timestamp;
        const dt = timestamp - s.lastTime;
        s.lastTime = timestamp;

        update(dt);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        draw(ctx);

        if (!s.isRunning) {
            // stop the loop
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        rafRef.current = requestAnimationFrame(loop);
    }

    useEffect(() => {
        // set up canvas size and initial road
        const canvas = canvasRef.current;
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        initRoad();

        // keyboard controls
        function keydown(e) {
            const s = stateRef.current;
            if (!s.isRunning && (e.key === "Enter" || e.key === " ")) {
                startGame();
                return;
            }
            if (e.key === "ArrowLeft" || e.key === "a") {
                s.player.vx = -320; // px/s
            } else if (e.key === "ArrowRight" || e.key === "d") {
                s.player.vx = 320;
            }
        }
        function keyup(e) {
            const s = stateRef.current;
            if ((e.key === "ArrowLeft" && s.player.vx < 0) || (e.key === "a" && s.player.vx < 0)) {
                s.player.vx = 0;
            } else if ((e.key === "ArrowRight" && s.player.vx > 0) || (e.key === "d" && s.player.vx > 0)) {
                s.player.vx = 0;
            }
        }
        window.addEventListener("keydown", keydown);
        window.addEventListener("keyup", keyup);

        // click to start / restart
        function onClick() {
            const s = stateRef.current;
            if (!s.isRunning) startGame();
        }
        canvas.addEventListener("click", onClick);

        return () => {
            window.removeEventListener("keydown", keydown);
            window.removeEventListener("keyup", keyup);
            canvas.removeEventListener("click", onClick);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initRoad, startGame]);

    // touch buttons (simple)
    function touchStart(dir) {
        const s = stateRef.current;
        s.player.vx = dir === "left" ? -320 : 320;
    }
    function touchEnd() {
        const s = stateRef.current;
        s.player.vx = 0;
    }

    return (
        <div style={{ width: GAME_WIDTH, margin: "0 auto", userSelect: "none" }}>
            <canvas
                ref={canvasRef}
                style={{ width: "100%", height: "auto", background: "#cfe9ff", display: "block" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                <div>Score: {score}</div>
                <div>
                    {running ? (
                        <button onClick={() => { stateRef.current.isRunning = false; stopGame(); }}>Pause</button>
                    ) : (
                        <button onClick={() => startGame()}>Start</button>
                    )}
                </div>
            </div>

            {/* simple touch controls */}
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 12 }}>
                <button
                    onMouseDown={() => touchStart("left")}
                    onMouseUp={() => touchEnd()}
                    onTouchStart={() => touchStart("left")}
                    onTouchEnd={() => touchEnd()}
                >
                    ◀
                </button>
                <button
                    onMouseDown={() => touchStart("right")}
                    onMouseUp={() => touchEnd()}
                    onTouchStart={() => touchStart("right")}
                    onTouchEnd={() => touchEnd()}
                >
                    ▶
                </button>
            </div>
        </div>
    );
}
