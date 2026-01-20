import React, { useRef, useEffect, useState, useCallback } from "react";

const WIDTH = 1200;
const HEIGHT = 600;

// -------------------------
// HELPERS
// -------------------------
function dist(a, b) {
    const dx = a.x - b.x,
        dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

// ⭐ WORKING ROUND RECT FUNCTION ⭐
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === "number") {
        r = { tl: r, tr: r, br: r, bl: r };
    }
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

// Draw checkered flag pattern
function drawCheckeredFlag(ctx, cx, cy, size = 44) {
    const squares = 5;
    const squareSize = size / squares;

    ctx.save();
    ctx.translate(cx - size / 2, cy - size / 2);

    for (let row = 0; row < squares; row++) {
        for (let col = 0; col < squares; col++) {
            // Checkered pattern
            if ((row + col) % 2 === 0) {
                ctx.fillStyle = "#000";
            } else {
                ctx.fillStyle = "#fff";
            }
            ctx.fillRect(col * squareSize, row * squareSize, squareSize, squareSize);
        }
    }

    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    ctx.restore();
}

export default function DoodleRoadGame() {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const stateRef = useRef({});
    const index = 1;
    const [mode, setMode] = useState("draw");
    const [score, setScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [showNextLevel, setShowNextLevel] = useState(false);
    const [levelCompleted, setLevelCompleted] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const finishAlertShown = useRef('');

    // -------------------------
    // INITIALIZE GAME STATE
    // -------------------------
    useEffect(() => {
        stateRef.current = {
            isDrawing: false,
            path: [],
            car: {
                x: 150,
                y: HEIGHT / 2,
                w: 46,
                h: 30,
                angle: 0,
                finished: false,
                falling: false,
                fallSpeed: 0,
            },
            finish: { x: WIDTH - 100, y: HEIGHT / 2, w: 44, h: 44 },
            playProgress: 0,
            playSpeed: 150,
            playing: false,
            lastTime: 0,
            sideMoveTime: 0,
        };
        finishAlertShown.current = false;
        setScore(0);
        setShowNextLevel(false);
        setGameStarted(false);
    }, [currentLevel]);

    // -------------------------
    // DRAW CAR
    // -------------------------
    function drawCar(ctx, cx, cy, angle = 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Shadow for depth
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // body
        ctx.fillStyle = "#ff4c5b";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 4;
        roundRect(ctx, -23, -12, 46, 24, 6, true, false);

        // Reset shadow for window
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // window
        ctx.fillStyle = "#cde7ff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.fillRect(-12, -8, 24, 10);
        ctx.strokeRect(-12, -8, 24, 10);

        // wheels
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-12, 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(12, 12, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // -------------------------
    // GRID
    // -------------------------
    function drawGrid(ctx) {
        ctx.strokeStyle = "rgba(0,0,0,0.06)";
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

    // -------------------------
    // LINE DRAWING INPUT
    // -------------------------
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const getRect = () => canvas.getBoundingClientRect();
        const toLocal = (e) => {
            const r = getRect();
            if (e.touches) e = e.touches[0];
            return {
                x: (e.clientX - r.left) * (WIDTH / r.width),
                y: (e.clientY - r.top) * (HEIGHT / r.height),
            };
        };

        const s = stateRef.current;

        function down(e) {
            if (mode !== "draw" || s.playing) return;
            e.preventDefault();
            s.isDrawing = true;
            s.path.push(toLocal(e));
        }
        function move(e) {
            if (!s.isDrawing || mode !== "draw" || s.playing) return;
            e.preventDefault();
            const p = toLocal(e);
            const last = s.path[s.path.length - 1];
            if (!last || dist(last, p) > 6) s.path.push(p);
        }
        function up() {
            s.isDrawing = false;
        }

        canvas.addEventListener("mousedown", down);
        canvas.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);

        canvas.addEventListener("touchstart", down, { passive: false });
        canvas.addEventListener("touchmove", move, { passive: false });
        window.addEventListener("touchend", up);

        return () => {
            canvas.removeEventListener("mousedown", down);
            canvas.removeEventListener("mousemove", move);
            window.removeEventListener("mouseup", up);
            canvas.removeEventListener("touchstart", down);
            canvas.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", up);
        };
    }, [mode]);

    // -------------------------
    // PLAY MODE START
    // -------------------------
    const startPlay = useCallback(() => {
        const s = stateRef.current;

        if (s.path.length < 3) {
            alert("Please draw a longer path!");
            return;
        }

        s.playing = true;
        s.playProgress = 0;
        s.car.finished = false;
        s.car.falling = false;
        s.car.fallSpeed = 0;
        finishAlertShown.current = false;
        setMode("play");
        setGameStarted(true);
        setShowNextLevel(false);

        if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    }, []);

    // -------------------------
    // FOLLOW PATH
    // -------------------------
    function followPath(progress, path) {
        if (path.length < 2) return null;

        let p = progress;
        for (let i = 0; i < path.length - 1; i++) {
            const a = path[i];
            const b = path[i + 1];
            const L = dist(a, b);

            if (p <= L) {
                const t = p / L;
                const x = a.x + (b.x - a.x) * t;
                const y = a.y + (b.y - a.y) * t;
                const angle = Math.atan2(b.y - a.y, b.x - a.x);
                return { x, y, angle };
            }
            p -= L;
        }
        return null;
    }

    // -------------------------
    // AABB
    // -------------------------
    function aabb(a, b) {
        return !(
            a.x + a.w < b.x ||
            a.x > b.x + b.w ||
            a.y + a.h < b.y ||
            a.y > b.y + b.h
        );
    }

    // -------------------------
    // MAIN LOOP
    // -------------------------
    function loop(ts) {
        const s = stateRef.current;
        if (!s.lastTime) s.lastTime = ts;
        const dt = (ts - s.lastTime) / 1000;
        s.lastTime = ts;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // movement
        if (s.playing && !s.car.finished) {
            s.playProgress += s.playSpeed * dt;

            const pos = followPath(s.playProgress, s.path);

            if (pos) {
                // Calculate the offsets based on the car's angle
                const CAR_OFFSET = -22;
                const oX = -Math.sin(pos.angle) * CAR_OFFSET;
                const oY = Math.cos(pos.angle) * CAR_OFFSET;

                // Apply the offsets to the car's position
                s.car.x = pos.x + oX;
                s.car.y = pos.y + oY;
                s.car.angle = pos.angle;
            } else {
                // Reached the end of the path but continue moving past the finish line
                s.car.finished = true;
                s.car.falling = true;
            }

            // Check if the car touches the finish line and show the alert
            const carRect = {
                x: s.car.x - s.car.w / 2,
                y: s.car.y - s.car.h / 2,
                w: s.car.w,
                h: s.car.h,
            };
            const f = s.finish;
            const fRect = {
                x: f.x - f.w / 2,
                y: f.y - f.h / 2,
                w: f.w,
                h: f.h,
            };

            // If the car touches the finish line and the alert hasn't been shown yet
            if (aabb(carRect, fRect) && !finishAlertShown.current) {
                finishAlertShown.current = true;  // Mark that the alert has been shown

                // Show the alert after the car touches the finish line, but do NOT stop the car
                setTimeout(() => {
                    alert(`🎉 Level ${currentLevel} Completed!`);
                    setShowNextLevel(true);  // Show the "Next Level" button
                }, 100); // Delay before showing the alert
            }

            setScore(Math.floor(s.playProgress / 5)); // Update the score based on the path progress
        }

        // Falling animation (car falls after finishing the path)
        if (s.car.falling && s.car.y < HEIGHT + 50) {
            s.car.y += s.car.fallSpeed;
            s.car.fallSpeed += 0.5;
            s.car.angle += 0.05;
        }

        // -------------------------
        // DRAW EVERYTHING
        // -------------------------
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fffefa";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        drawGrid(ctx);

        // path - draw with shadow for depth
        if (s.path.length > 1) {
            // Path shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.lineWidth = 5;
            ctx.strokeStyle = "#3a3a3a";
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(s.path[0].x, s.path[0].y);
            for (let p of s.path) ctx.lineTo(p.x, p.y);
            ctx.stroke();

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
        }

        // finish flag
        drawCheckeredFlag(ctx, s.finish.x, s.finish.y, s.finish.w);

        // car - drawn last so it appears on top
        if (s.car.y < HEIGHT + 50) {
            drawCar(ctx, s.car.x, s.car.y, s.car.angle);
        }

        rafRef.current = requestAnimationFrame(loop);  // Continue the loop for the next frame
    }



    // -------------------------
    // CANVAS SETUP AND INITIAL DRAW
    // -------------------------
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        // Initial draw
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fffefa";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        drawGrid(ctx);

        // Draw initial car and finish flag
        const s = stateRef.current;
        drawCheckeredFlag(ctx, s.finish.x, s.finish.y, s.finish.w);
        drawCar(ctx, s.car.x, s.car.y, s.car.angle);

        if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
    }, []);

    // -------------------------
    // RESTART GAME
    // -------------------------
    const restartLevel = () => {
        const s = stateRef.current;
        s.path = [];
        s.playing = false;
        s.playProgress = 0;
        s.car.x = 150;
        s.car.y = HEIGHT / 2;
        s.car.angle = 0;
        s.car.finished = false;
        s.car.falling = false;
        s.car.fallSpeed = 0;
        finishAlertShown.current = false;
        setScore(0);
        setMode("draw");
        setShowNextLevel(true);
        setGameStarted(false);
    };


    // -------------------------
    // NEXT LEVEL
    // -------------------------
    const goToNextLevel = () => {
        setCurrentLevel((prev) => prev + 1);
        setMode("draw");
        setLevelCompleted(false);  // Reset level completed flag for next level
    };

    // -------------------------
    // RENDER UI
    // -------------------------
    return (
        <div className="doodle-road-game">
            <div className="game-wrapper">
                {/* Header */}
                <div className="game-header">
                    <h1>Doodle Road - Level {currentLevel} </h1>
                    <div className="score-display">
                        <span className="star-icon">★</span>
                        <span>{score}</span>
                    </div>
                </div>

                {/* Canvas Container */}
                <div className="canvas-container">
                    <canvas ref={canvasRef} />
                </div>

                {/* Buttons */}
                {!gameStarted ? (
                    <div className="button-controls">
                        <button
                            onClick={() => setMode("draw")}
                            className={`btn-draw ${mode === "draw" ? "active" : ""}`}
                        >
                            Draw
                        </button>

                        <button
                            onClick={() => setMode("cut")}
                            className={`btn-cut ${mode === "cut" ? "active" : ""}`}
                        >
                            Cut
                        </button>

                        <button onClick={startPlay} className="btn-start">
                            Start
                        </button>

                        <button onClick={restartLevel} className="btn-clear">
                            Clear
                        </button>

                        <button
                            onClick={() => alert("Menu - Coming soon!")}
                            className="btn-menu"
                        >
                            Menu
                        </button>
                    </div>
                ) : (
                    <div className="gameplay-controls">
                        {/* Left side icons */}
                        <div className="left-icons">
                            <button
                                onClick={restartLevel}
                                className="icon-btn-restart"
                                title="Restart"
                            >
                                🔄
                            </button>

                            <button
                                onClick={restartLevel}
                                className="icon-btn-eraser"
                                title="Eraser"
                            >
                                ✏️
                            </button>
                        </div>

                        {/* Right side START button */}
                        {showNextLevel && (
                            <button onClick={goToNextLevel} className="btn-next-level">
                                NEXT LEVEL ▶
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
