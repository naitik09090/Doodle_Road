import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Star, Zap, Skull, Trophy, Pencil, Rocket, Trash2 } from 'lucide-react';
import fuelIcon from "../assets/fuel.png";

const fuelImg = new Image();
fuelImg.src = fuelIcon;

fuelImg.onload = () => {
    console.log("Fuel icon loaded");
};


// કેનવાસનું size
// const WIDTH = 1200;
// const HEIGHT = 600;

// // 21-01 🎯 Base Canvas Size
// const BASE_WIDTH = 1250;
// const BASE_HEIGHT = 702;
// 21-01 🎯 Base Canvas Size
const BASE_WIDTH = 1450;
const BASE_HEIGHT = 800;

// 🎯 Game Canvas Size (use everywhere)
const WIDTH = BASE_WIDTH;
const HEIGHT = BASE_HEIGHT;


// 24-12 -- animation//
let finishConfetti = [];
let finishSparkles = []; // ✨ Sparkle particles
let finishRings = [];    // 🔵 Expanding rings
let finishOverlayAlpha = 0;
let finishAnimActive = false;
let finishPhase = 0;      // 0 = bright, 1 = dark
let finishTimer = 0;
let finishHold = false;     // 🔒 animation lock until click
//let burstCooldown = 0;   // 🔥 controlled extra bursts


// 26-12 --winner//
// // // 🏆 WINNER TEXT
let winnerScale = 0;
let winnerAlpha = 1;
let winnerGlow = 0;
let winnerPulse = 0;
let showNextBanner = false;  // 31-12//

function spawnFinishBlast(WIDTH, HEIGHT) {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    // 🎉 Main confetti burst - MORE particles
    for (let i = 0; i < 350; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 14 + 8;

        finishConfetti.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 180,
            maxLife: 180,
            size: Math.random() * 8 + 4,
            color: `hsl(${Math.random() * 360}, 100%, 65%)`,
            line: Math.random() > 0.3
        });
    }

    // ✨ Add sparkles that appear randomly
    for (let i = 0; i < 50; i++) {
        finishSparkles.push({
            x: cx + (Math.random() - 0.5) * 600,
            y: cy + (Math.random() - 0.5) * 400,
            life: 80 + Math.random() * 60,
            maxLife: 140,
            size: Math.random() * 12 + 6,
            twinkle: Math.random() * Math.PI * 2,
            color: Math.random() > 0.5 ? '#ffd700' : '#ffffff'
        });
    }

    // 🔵 Add expanding ring
    // finishRings.push({
    //     x: cx,
    //     y: cy,
    //     radius: 10,
    //     maxRadius: 400,
    //     life: 60,
    //     maxLife: 60,
    //     color: 'rgba(255, 215, 0, 0.6)'
    // });
}


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

// ⭐ Petrol Pump Collision Helper
function checkPetrolPumpCollision(car, pump) {
    const dx = car.x - pump.x;
    const dy = car.y - pump.y;
    return Math.hypot(dx, dy) < pump.r + car.w / 2;
}

// 23-01//
function isCarReallyMoving(car) {
    const dx = car.x - car.lastX;
    const dy = car.y - car.lastY;
    return Math.abs(dx) > 1 || Math.abs(dy) > 1;
}



const LEVEL_CONFIGS = [
    {
        level: 1,
        name: 'Easy Start',
        carStart: { x: 150, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 90,
        bgColor: '#fff9f0',
        gridColor: 'rgba(255, 180, 150, 0.15)',
        pathColor: '#ff6b6b',
        carColor: '#ff4c5b',
        // obstacles: [],
        // obstacles: [
        //     { x: 685, y: 360, w: 80, h: 80 },
        // ]
    },
    {
        level: 2,
        name: 'Curve Master',
        carStart: { x: 150, y: HEIGHT / 2.2 },
        finishPos: { x: WIDTH - 100, y: HEIGHT / 2.2 },
        playSpeed: 100,
        bgColor: '#f0f9ff',
        gridColor: 'rgba(150, 200, 255, 0.15)',
        pathColor: '#4c9aff',
        carColor: '#2196F3',
        obstacles: [
            { x: 705, y: 380, w: 40, h: 40 },
            { x: 705, y: 335, w: 40, h: 40 },
            { x: 705, y: 425, w: 40, h: 40 },
        ]
    },
    {
        level: 3,
        name: 'Box Avoider',
        carStart: { x: 100, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 80, y: HEIGHT / 2 },
        playSpeed: 100,
        bgColor: '#f0fff4',
        gridColor: 'rgba(150, 255, 180, 0.15)',
        pathColor: '#def50cff',
        carColor: '#000c06ff',
        obstacles: [
            { x: 685, y: 360, w: 80, h: 80 },
        ]
    },
    {
        level: 4,
        name: 'Zigzag',
        carStart: { x: 150, y: 250 },
        finishPos: { x: WIDTH - 100, y: HEIGHT - 100 },
        playSpeed: 100,
        bgColor: '#fffaf0',
        gridColor: 'rgba(255, 200, 100, 0.15)',
        pathColor: '#ed8936',
        carColor: '#dd6b20',
        obstacles: [
            { x: 565, y: 350, w: 60, h: 60 },
            { x: 825, y: 470, w: 60, h: 60 }
        ]
    },
    {
        level: 5,
        name: 'Challenge',
        carStart: { x: 150, y: HEIGHT - 390 },
        finishPos: { x: WIDTH - 100, y: HEIGHT - 100 },
        playSpeed: 100,
        bgColor: '#faf5ff',
        gridColor: 'rgba(200, 150, 255, 0.15)',
        pathColor: '#9f7aea',
        carColor: '#805ad5',
        obstacles: [
            { x: 465, y: 330, w: 40, h: 40 },
            { x: 465, y: 390, w: 40, h: 40 },
            { x: 465, y: 450, w: 40, h: 40 },
            { x: 465, y: 510, w: 40, h: 40 },
            { x: 465, y: 580, w: 40, h: 40 },

            { x: 705, y: 200, w: 40, h: 40 },
            { x: 705, y: 250, w: 40, h: 40 },
            { x: 705, y: 300, w: 40, h: 40 },
            { x: 705, y: 350, w: 40, h: 40 },
            { x: 705, y: 400, w: 40, h: 40 },

            { x: 935, y: 330, w: 40, h: 40 },
            { x: 935, y: 390, w: 40, h: 40 },
            { x: 935, y: 450, w: 40, h: 40 },
            { x: 935, y: 510, w: 40, h: 40 },
            { x: 935, y: 580, w: 40, h: 40 },
        ]
    },

    // ⭐ NEW LEVELS BELOW ⭐

    {
        level: 6,
        name: 'Moving Box',
        carStart: { x: 150, y: 340 },
        finishPos: { x: WIDTH - 200, y: HEIGHT - 150 },
        playSpeed: 100,
        bgColor: '#fef7f7',
        gridColor: 'rgba(255, 140, 150, 0.15)',
        pathColor: '#ef476f',
        carColor: '#d90429',
        obstacles: [
            { x: 690, y: 365, w: 70, h: 70, moving: true, dx: 2 }
        ]
    },
    {
        level: 7,
        name: 'Narrow Tunnel',
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 100, y: HEIGHT / 2 },
        playSpeed: 120,
        bgColor: '#e8faff',
        gridColor: 'rgba(130,180,255,0.2)',
        pathColor: '#0077b6',
        carColor: '#023e8a',
        obstacles: [
            { x: 475, y: 250, w: 40, h: 300 },
            { x: 935, y: 250, w: 40, h: 300 }
        ]
    },
    {
        level: 8,
        name: 'Box Maze',
        carStart: { x: 180, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 180, y: HEIGHT / 2 },
        playSpeed: 100,
        bgColor: '#fffce8',
        gridColor: 'rgba(250,200,80,0.15)',
        pathColor: '#f6c23e',
        carColor: '#d69e2e',
        obstacles: [
            { x: 485, y: 430, w: 100, h: 100 },
            { x: 665, y: 240, w: 120, h: 80 },
            { x: 885, y: 390, w: 100, h: 120 }
        ]
    },
    {
        level: 9,
        name: 'Box Gauntlet',
        carStart: { x: 150, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 100,
        bgColor: '#f3f0ff',
        gridColor: 'rgba(180,140,255,0.15)',
        pathColor: '#7f00ff',
        carColor: '#5a00d1',
        obstacles: [
            // Left Column (centered top/bottom)
            { x: 425, y: 150, w: 40, h: 200 },
            { x: 425, y: 450, w: 40, h: 200 },

            // Center Column (gap shifted)
            { x: 725, y: 0, w: 40, h: 300 },
            { x: 725, y: 500, w: 40, h: 300 },

            // Right Column (gap centered again)
            { x: 1025, y: 150, w: 40, h: 200 },
            { x: 1025, y: 450, w: 40, h: 200 },
        ]
    },

    // ⭐ NEW LEVELS BELOW ⭐    

    {
        level: 10,
        name: 'ULTRA BOX HELL',
        carStart: { x: 150, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 100,
        bgColor: '#fff1f1',
        gridColor: 'rgba(255,80,80,0.2)',
        pathColor: '#c1121f',
        carColor: '#780000',
        obstacles: [
            { x: 410, y: 320, w: 80, h: 80 },
            { x: 610, y: 240, w: 80, h: 80 },
            { x: 730, y: 410, w: 80, h: 80 },
            { x: 960, y: 350, w: 80, h: 80 }
        ]
    },
    {
        level: 11,
        name: 'Sweeper Lane',
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 120, y: HEIGHT / 2 },
        playSpeed: 100,
        bgColor: '#f8fff7',
        gridColor: 'rgba(160,240,180,0.12)',
        pathColor: '#2d6a4f',
        carColor: '#1b4332',
        // obstacles: [
        //     { x: 400, y: 120, w: 80, h: 40, moving: true, dx: 0, dy: 1.6, yRange: [120, 360] },
        //     { x: 650, y: 360, w: 80, h: 40, moving: true, dx: 0, dy: -1.2, yRange: [120, 360] }
        // ]
        obstacles: [
            { x: 455, y: 0, w: 40, h: 280 },
            { x: 455, y: 420, w: 40, h: 380 },
            { x: 705, y: 200, w: 40, h: 400 },
            { x: 955, y: 0, w: 40, h: 350 },
            { x: 955, y: 450, w: 40, h: 350 },
        ]
    },
    {
        level: 12,
        name: 'Runner Blocks',
        carStart: { x: 100, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 140, y: HEIGHT / 2 },
        playSpeed: 96,
        bgColor: '#fff8f0',
        gridColor: 'rgba(255,200,150,0.12)',
        pathColor: '#ff7b00',
        carColor: '#b45309',
        petrolPump: [{ x: 660, y: 430, r: 26 }],
        obstacles: [
            { x: 450, y: 320, w: 60, h: 300, moving: true, dy: 2.5, yRange: [120, 350], bidir: true },
            { x: 570, y: 470, w: 80, h: 60 },
            { x: 700, y: 360, w: 70, h: 70, moving: true, dx: 2, xRange: [650, 800], bidir: true },
            { x: 850, y: 450, w: 90, h: 60 },
            { x: 1000, y: 370, w: 60, h: 60, moving: true, dy: -2.3, yRange: [150, 350], bidir: true },
        ]
    },
    {
        level: 13,
        name: 'Pinball Alley',
        carStart: { x: 140, y: HEIGHT / 3 },
        finishPos: { x: WIDTH - 140, y: HEIGHT / 1.7 },
        playSpeed: 92,
        bgColor: '#fff0f6',
        gridColor: 'rgba(255,180,200,0.12)',
        pathColor: '#d0006f',
        carColor: '#7a0826',
        // petrolPump: [{ x: 520, y: 120, r: 26 }],
        petrolPump: [{ x: 970, y: 370, r: 26 }],
        obstacles: [
            { x: 345, y: 270, w: 120, h: 90 },
            { x: 335, y: 470, w: 120, h: 120 },
            { x: 555, y: 390, w: 120, h: 120 },
            { x: 775, y: 280, w: 120, h: 120 },
            { x: 995, y: 460, w: 120, h: 120 },
        ],
    },
    {
        level: 14,
        name: 'Squeeze & Dash',
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 120, y: HEIGHT / 2 },
        playSpeed: 86,
        bgColor: '#f3f6ff',
        gridColor: 'rgba(160,180,255,0.12)',
        pathColor: '#274c77',
        carColor: '#1f3a93',
        //petrolPump: [{ x: 520, y: 120, r: 26 }],
        petrolPump: [{ x: 970, y: 370, r: 26 }],
        obstacles: [
            // two narrow vertical walls that move closer/further
            { x: 575, y: 220, w: 30, h: 420, moving: true, dx: 1.8, xRange: [575, 635], bidir: true },
            { x: 885, y: 220, w: 30, h: 440, moving: true, dx: -1.8, xRange: [835, 895], bidir: true },

            // final small moving blocker
            { x: 1015, y: 380, w: 60, h: 60, moving: true, dy: 2.5, yRange: [180, 360], bidir: true },
        ]
    },

    // ⭐ NEW LEVELS BELOW ⭐  

    {
        level: 15,
        name: "Zigzag Sprint",
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 140, y: HEIGHT / 2 },
        playSpeed: 92,
        bgColor: "#fdf6e3",
        gridColor: "rgba(255,200,80,0.15)",
        pathColor: "#c99a00",
        carColor: "#8b6800",
        petrolPump: [{ x: 890, y: 290, r: 26 }],
        obstacles: [
            { x: 535, y: 240, w: 50, h: 420, moving: true, dy: 3.2, yRange: [120, 360], bidir: true },
            { x: 915, y: 240, w: 50, h: 420, moving: true, dy: -3.2, yRange: [120, 360], bidir: true },

            // chaotic moving pinballs
            { x: 1095, y: 250, w: 70, h: 70, moving: true, dx: 3.5, xRange: [1045, 1175], bidir: true },
            { x: 1095, y: 460, w: 70, h: 70, moving: true, dx: -3.5, xRange: [1045, 1175], bidir: true },
            { x: 985, y: 370, w: 60, h: 60, moving: true, dy: 3, yRange: [180, 360], bidir: true },
        ]
    },
    {
        level: 16,
        name: "Gate Keeper",
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 90,
        bgColor: "#eef7ff",
        gridColor: "rgba(100,150,255,0.12)",
        pathColor: "#2563eb",
        carColor: "#1e40af",
        petrolPump: [{ x: 890, y: 290, r: 26 }],
        obstacles: [
            // top & bottom walls (same)
            { x: 405, y: 220, w: 640, h: 36 },
            { x: 405, y: 570, w: 640, h: 36 },

            // snake pillars (more gap + thinner)
            { x: 499, y: 390, w: 32, h: 180 },
            { x: 639, y: 250, w: 32, h: 180 },
            { x: 779, y: 390, w: 32, h: 180 },
            { x: 919, y: 250, w: 32, h: 180 }
        ]
    },
    {
        level: 17,
        name: "Wave Tunnel",
        carStart: { x: 140, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 98,
        bgColor: "#f0fff4",
        gridColor: "rgba(120,255,140,0.12)",
        pathColor: "#19944b",
        carColor: "#0d5e2d",
        petrolPump: [{ x: 890, y: 290, r: 26 }],
        obstacles: [
            { x: 455, y: 490, w: 90, h: 90 },
            { x: 595, y: 240, w: 60, h: 220 },
            { x: 715, y: 530, w: 180, h: 32 },
            { x: 955, y: 280, w: 40, h: 260 }
        ]
    },
    {
        level: 18,
        name: "Chaos Grid",
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 130, y: HEIGHT / 2 },
        playSpeed: 102,
        bgColor: "#f8f3ff",
        gridColor: "rgba(180,140,255,0.12)",
        pathColor: "#7e22ce",
        carColor: "#581c87",
        petrolPump: [
            { x: 715, y: 370, r: 30 }
        ],
        obstacles: [
            // Small rapidly moving mines everywhere
            { x: 380, y: 320, w: 45, h: 45, moving: true, dx: 5, xRange: [350, 500], bidir: true },
            { x: 420, y: 390, w: 45, h: 45, moving: true, dy: 4.5, yRange: [200, 340], bidir: true },
            { x: 480, y: 460, w: 45, h: 45, moving: true, dx: -5, xRange: [380, 520], bidir: true },

            { x: 620, y: 250, w: 45, h: 45, moving: true, dy: -4.8, yRange: [160, 300], bidir: true },
            { x: 680, y: 470, w: 45, h: 45, moving: true, dx: 4.5, xRange: [580, 720], bidir: true },
            { x: 720, y: 390, w: 45, h: 45, moving: true, dy: 4.2, yRange: [180, 320], bidir: true },

            { x: 880, y: 320, w: 45, h: 45, moving: true, dx: -4.8, xRange: [780, 920], bidir: true },
            { x: 920, y: 390, w: 45, h: 45, moving: true, dy: -4.5, yRange: [200, 340], bidir: true },
            { x: 980, y: 450, w: 45, h: 45, moving: true, dx: 5, xRange: [880, 1020], bidir: true },

            { x: 1050, y: 320, w: 45, h: 45, moving: true, dy: 4.8, yRange: [180, 320], bidir: true },
        ]
    },
    {
        level: 19,
        name: "Narrow Gauntlet",
        carStart: { x: 140, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 112,
        bgColor: "#fff0f3",
        gridColor: "rgba(255,100,140,0.12)",
        pathColor: "#e43052",
        carColor: "#8e0f20",

        // petrolPump: { x: 560, y: 180, w: 70, h: 70, mandatory: true },

        petrolPump: [
            { x: 640, y: HEIGHT / 2 - 30, r: 26 },
        ],
        obstacles: [
            // two narrow vertical walls that move closer/further
            { x: 475, y: 260, w: 30, h: 420, moving: true, dx: 1.8, xRange: [475, 535], bidir: true },
            { x: 775, y: 220, w: 30, h: 440, moving: true, dx: -1.8, xRange: [735, 795], bidir: true },

            // final small moving blocker
            { x: 975, y: 420, w: 60, h: 60, moving: true, dy: 2.5, yRange: [180, 360], bidir: true },
        ]
    },
    {
        level: 20,
        name: "Pinball Madness",
        carStart: { x: 120, y: HEIGHT / 3 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 1.5 },
        playSpeed: 118,
        bgColor: "#eef9f1",
        gridColor: "rgba(140,255,160,0.12)",
        pathColor: "#1f9850",
        carColor: "#0d6e32",
        petrolPump: [
            { x: 850, y: HEIGHT / 2 + 19, r: 30 },
        ],
        obstacles: [
            // static angled blockers
            { x: 435, y: 290, w: 60, h: 80 },
            { x: 535, y: 450, w: 60, h: 80 },
            { x: 635, y: 290, w: 50, h: 420, moving: true, dx: 2, xRange: [615, 715], bidir: true },
            { x: 955, y: 290, w: 60, h: 350 },
            { x: 775, y: 420, w: 70, h: 70, moving: true, dy: 2.8, yRange: [180, 360], bidir: true },
        ]
    },


];

// distance between two points.
// ગેમમાં line draw કરતી વખતે smooth points મેળવવા માટે ઉપયોગ થાય
function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

// Canvas પર rounded rectangle draw કરે છે
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    // ctx.lineTo(x + w - r.tr, y);
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


// 19-12// // 29-01 //
function drawFuelBar(ctx, car) {
    const isMobile = window.innerWidth <= 768;
    const barW = isMobile ? 170 : 220;
    const barH = isMobile ? 14 : 18;
    const barX = 25;
    const barY = isMobile ? 55 : 40;

    const fuelRatio = Math.max(0, Math.min(1, car.fuel / car.maxFuel));
    const fuelWidth = fuelRatio * barW;
    const percent = Math.round(fuelRatio * 100);

    ctx.save();

    // 1. Labels (Bold & High Contrast)
    // ctx.fillStyle = "#000";
    ctx.font = `bold ${isMobile ? '14px' : '16px'} Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText("⛽ Fuel", barX, barY - 10);

    ctx.textAlign = 'right';
    // Percentage turns red when low fuel
    ctx.fillStyle = percent <= 15 ? "#dc2626" : "#000";
    ctx.font = `900 ${isMobile ? '14px' : '16px'} Arial, sans-serif`;
    ctx.fillText(`${percent}%`, barX + barW, barY - 10);

    // 2. Background Slot (Game Style)
    // ctx.fillStyle = "rgba(0, 0, 0, 0.1)"; // Light grey track
    // roundRect(ctx, barX, barY, barW, barH, barH / 2, true, false);

    // 3. Fuel Bar Container Path (Perfect Pill Shape)
    ctx.beginPath();
    const r = barH / 2;
    ctx.moveTo(barX + r, barY);
    ctx.lineTo(barX + barW - r, barY); // 04-02 --fuelborder//
    ctx.arc(barX + barW - r, barY + r, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(barX + r, barY + barH);
    ctx.arc(barX + r, barY + r, r, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    // Save for clipping
    ctx.save();
    ctx.clip();

    // Draw Fuel Fill // 04-02 --fuelborder//
    if (fuelWidth > 0) {
        let colorMain = fuelRatio > 0.4 ? "#22c55e" : (fuelRatio > 0.15 ? "#f59e0b" : "#ef4444");
        let colorLight = fuelRatio > 0.4 ? "#86efac" : (fuelRatio > 0.15 ? "#fcd34d" : "#fca5a5");

        const grad = ctx.createLinearGradient(barX, barY, barX, barY + barH);
        grad.addColorStop(0, colorLight);
        grad.addColorStop(1, colorMain);
        ctx.fillStyle = grad;
        ctx.fillRect(barX, barY, fuelWidth, barH);
    }
    ctx.restore();

    // 4. Black Border (Perfect Overlay) // 04-02 --fuelborder--
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.stroke();

    ctx.restore();
}

// Finish line નું checkered flag draw કરે છે.
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

    const [showTools, setShowTools] = useState(false); // 22-01 --responsive//
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // 22-01 --responsive//


    const [mode, setMode] = useState('draw');
    const [score, setScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [showNextLevel, setShowNextLevel] = useState(false);
    const [showLevelComplete, setShowLevelComplete] = useState(false); // 26-12 --banner//
    const [gameStarted, setGameStarted] = useState(false);
    const [showGameOver, setShowGameOver] = useState(false); // 28-01 --gameover//




    const [totalStars, setTotalStars] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [kills, setKills] = useState(0);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []); //

    // Timer Logic
    useEffect(() => {
        let interval;
        if (gameStarted && mode === 'play' && !showLevelComplete) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [gameStarted, mode, showLevelComplete]);



    // Format time to MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    //  const [levelStars, setLevelStars] = useState(0);

    const currentConfig = LEVEL_CONFIGS[currentLevel - 1];

    // currentLevel બદલાય ત્યારે ચાલે
    useEffect(() => {
        const config = LEVEL_CONFIGS[currentLevel - 1];
        // Replace stateRef.current = { ... } inside the currentLevel effect with this

        stateRef.current = {
            isDrawing: false,
            path: [],
            car: {
                x: config.carStart.x,
                y: config.carStart.y,
                w: 75,
                h: 50,
                angle: 0,
                finished: false,
                falling: false,

                vy: 0, // vertical velocity (important)
                // gravity: 0.2,  
                visible: true,
                //19-12 //
                fuel: 100,
                maxFuel: 100,
                //fuelDrainRate: 0.03,
                fuelDrainRate: 0.05,

                lastX: config.carStart.x,   // 23-01//
                lastY: config.carStart.y    // 23-01 //

            },
            finish: {
                x: config.finishPos.x,
                y: config.finishPos.y,
                w: 44,
                h: 44
            },
            playProgress: 0,
            playSpeed: config.playSpeed, // ensure it's set to level config
            playing: false,
            lastTime: 0,
            sideMoveTime: 0,
            startTime: 0

        };

        finishAlertShown.current = false;

        setScore(0); // 04-02 --scoreset//
        setShowNextLevel(false);
        setGameStarted(false);
        setShowGameOver(false); // 28-01 --gameover//

        // setLevelStars(0);
        // setLevelCompleted(false);
    }, [currentLevel]);


    // Create Car Design Show
    function drawCar(ctx, cx, cy, angle = 0) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.fillStyle = currentConfig.carColor;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        roundRect(ctx, -37.5, -20, 75, 40, 10, true, false);
        ctx.fillStyle = '#cde7ff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(-19, -15, 38, 16);
        ctx.strokeRect(-19, -15, 38, 16);
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-20, 20, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(20, 20, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // // // 19-12//
    // function checkPetrolPumpCollision(car, pump) {
    //     const dx = car.x - pump.x;
    //     const dy = car.y - pump.y;
    //     return Math.hypot(dx, dy) < pump.r + car.w / 2;
    // }


    // Back-Ground Canvas Design Grid View
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



    // 19-12//
    // function drawPetrolPump(ctx, pump) {
    //     ctx.save();
    //     ctx.translate(pump.x, pump.y);

    //     const width = 25;
    //     const height = 37;

    //     if (fuelImg.complete) {
    //         ctx.drawImage(fuelImg, -width / 2, -height / 2, width, height);
    //     }

    //     ctx.restore();
    // }


    // 19-12//
    // ⛽ PETROL PUMP DRAW FUNCTION — ⭐ અહીં ADD કર ⭐
    // function drawPetrolPump(ctx, pump) {
    //     if (!pump) return;
    //     ctx.save();

    //     ctx.drawImage(
    //         fuelImg,
    //         pump.x - pump.r,
    //         pump.y - pump.r,
    //         pump.r * 1,
    //         pump.r * 1,
    //     );
    //     ctx.restore();
    // }


    // // 06-01 --petrolbug//
    function drawPetrolPump(ctx, pump) {
        if (!pump || pump.used) return;   // ⭐ MAIN FIX

        ctx.save();
        ctx.drawImage(
            fuelImg,
            pump.x - pump.r,
            pump.y - pump.r,
            pump.r * 1,
            pump.r * 1,
        );
        ctx.restore();
    }




    // function drawPetrolPump(ctx) {
    //     activePetrolPumps.forEach(pump => {
    //         ctx.drawImage(
    //             fuelImg,
    //             pump.x - pump.r,
    //             pump.y - pump.r,
    //             pump.r * 1,
    //             pump.r * 1,
    //         );
    //     });
    // }

    // // // 19-12//
    // function checkPetrolPumpCollision(car, pump) {
    //     const dx = car.x - pump.x;
    //     const dy = car.y - pump.y;
    //     return Math.hypot(dx, dy) < pump.r + car.w / 2;
    // }

    // Line Draw For Canvas
    useEffect(() => {

        const canvas = canvasRef.current;
        if (!canvas) return;

        // prevent the browser from handling touch gestures (so touchmove works well)
        canvas.style.touchAction = 'none';

        const getRect = () => canvas.getBoundingClientRect();

        const toLocal = (e) => {
            const r = getRect();
            let cx, cy;

            if (e.changedTouches && e.changedTouches.length > 0) {
                cx = e.changedTouches[0].clientX;
                cy = e.changedTouches[0].clientY;
            } else if (e.touches && e.touches.length > 0) {
                cx = e.touches[0].clientX;
                cy = e.touches[0].clientY;
            } else {
                cx = e.clientX;
                cy = e.clientY;
            }

            return {
                x: (cx - r.left) * (WIDTH / r.width),
                y: (cy - r.top) * (HEIGHT / r.height)
            };
        }


        // 22-12//
        const s = stateRef.current;
        const config = LEVEL_CONFIGS[currentLevel - 1];
        s.config = config;
        stateRef.current.config = config; // 19-12//


        function down(e) {
            if (mode !== 'draw' || s.playing) return;
            if (e.cancelable) e.preventDefault();

            s.isDrawing = true;
            const p = toLocal(e);

            // Now push the starting point of the new stroke
            s.path.push({
                x: p.x,
                y: p.y,
                break: true
            });
        }


        function move(e) {
            if (!s.isDrawing || mode !== 'draw' || s.playing) return;
            if (e.cancelable) e.preventDefault();

            const p = toLocal(e);

            const last = s.path[s.path.length - 1];

            // Reduced threshold from 6 to 3 for better responsivenes
            if (!last || dist(last, p) > 3) {
                s.path.push({ x: p.x, y: p.y });
            }
        }

        function up() {
            s.isDrawing = false;
        }

        // ensure state arrays exist
        if (!Array.isArray(s.path)) s.path = [];

        // --- add mouse, touch, and pointer fallbacks ---
        // Mouse
        canvas.addEventListener('mousedown', down);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);

        // Touch
        canvas.addEventListener('touchstart', down, { passive: false });
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', up);

        return () => {
            // cleanup all we added
            canvas.removeEventListener('mousedown', down);
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);

            canvas.removeEventListener('touchstart', down);
            window.removeEventListener('touchmove', move);
            window.removeEventListener('touchend', up);
        };
    }, [mode]);





    // ----------------- START PLAY (updated) -----------------
    const startPlay = useCallback(() => {
        const s = stateRef.current;
        const config = LEVEL_CONFIGS[currentLevel - 1];


        // stateRef.current.config = config;

        // 🔑 THIS IS THE KEY LINE
        // s.config = config;
        //      stateRef.current.config = config; // 19-12//

        // --- reset physics / states ---
        s.lastTime = 0; // Reset timing to avoid massive first-frame delta
        s.playSpeed = typeof config.playSpeed === 'number' ? config.playSpeed : (s.playSpeed || 120);

        // 🔄 ALWAYS Reset car to start position when clicking Start
        if (s.car === undefined) {
            s.car = { x: config.carStart.x, y: config.carStart.y, w: 75, h: 50, angle: 0 };
        } else {
            s.car.x = config.carStart.x;
            s.car.y = config.carStart.y;
            s.car.angle = 0;
        }

        if (s.car.vy === undefined) s.car.vy = 0;
        else s.car.vy = 0;

        if (s.car.gravity === undefined) s.car.gravity = 0.2;
        s.car.falling = false;
        s.car.finished = false;
        s.car.dead = false; // Reset dead state

        // safety: ensure path is an array
        if (!Array.isArray(s.path)) s.path = [];

        // if path too short → just fall
        if (s.path.length < 1) {
            console.log('startPlay: no path -> falling');
            s.playing = true; // 31-01: Game is active even if falling
            s.playProgress = 0;
            s.car.falling = true;
            s.car.vy = 0;
            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
            setMode('play');
            setGameStarted(false);
            return;
        }

        // --- decide where to attach the car to the path ---
        const firstPoint = s.path[0];
        const dx = firstPoint.x - s.car.x;
        const dy = firstPoint.y - s.car.y;
        const distToStart = Math.hypot(dx, dy);
        const SNAP_THRESHOLD = 40; // 🎯 Increased threshold for better magnetic snapping

        if (distToStart <= SNAP_THRESHOLD) {
            // ensure path begins from car so followPath has a sensible starting segment
            if (Math.hypot(s.car.x - firstPoint.x, s.car.y - firstPoint.y) > 1) {
                s.path.unshift({ x: s.car.x, y: s.car.y });
                // 🎯 CRITICAL: Remove break from the first user point to merge with car
                if (s.path[1]) delete s.path[1].break;
            }
            // if still only one point (rare) duplicate to form a tiny segment
            if (s.path.length === 1) s.path.push({ x: s.path[0].x + 1, y: s.path[0].y });

            s.car.falling = false;
            s.car.vy = 0;
            s.playing = true;
            s.playProgress = 0;
            s.car.finished = false;

            console.log('startPlay: snapped to start', { playProgress: s.playProgress, pathLen: s.path.length });
        } else {
            // try to find nearest point on path regardless of vertical direction
            const HORIZ_TOL = 150; // 🎯 Much more forgiving horizontal range
            const VERT_TOL = 450;  // 🎯 Much more forgiving vertical range

            let cum = [0];
            for (let i = 1; i < s.path.length; i++) {
                const a = s.path[i - 1], b = s.path[i];
                cum[i] = cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y);
            }

            let bestIdx = -1;
            let bestDist = Infinity;  // 28-01//

            for (let i = 0; i < s.path.length; i++) {
                const p = s.path[i];
                const dxp = Math.abs(p.x - s.car.x);
                const dyp = Math.abs(p.y - s.car.y); // 🎯 Check both above and below

                if (dxp <= HORIZ_TOL && dyp <= VERT_TOL) {
                    const totalDist = dxp + dyp;
                    if (totalDist < bestDist) {
                        bestDist = totalDist;
                        bestIdx = i;
                    }
                }
            }

            // Fallback: if no point found but path exists, maybe just snap to path start if it's "kind of" in front //28-01//
            if (bestIdx === -1 && s.path.length > 0) {
                const p = s.path[0];
                if (p.x >= s.car.x - 50) { // If path is roughly in front or slightly behind
                    bestIdx = 0;
                }
            }

            if (bestIdx !== -1) {
                s.playProgress = cum[bestIdx] || 0;

                const CAR_OFFSET = -29;
                let angle = 0;
                if (bestIdx < s.path.length - 1) {
                    angle = Math.atan2(s.path[bestIdx + 1].y - s.path[bestIdx].y, s.path[bestIdx + 1].x - s.path[bestIdx].x);
                } else if (bestIdx > 0) {
                    angle = Math.atan2(s.path[bestIdx].y - s.path[bestIdx - 1].y, s.path[bestIdx].x - s.path[bestIdx - 1].x);
                }
                const oX = -Math.sin(angle) * CAR_OFFSET;
                const oY = Math.cos(angle) * CAR_OFFSET;

                s.car.x = s.path[bestIdx].x + oX;
                s.car.y = s.path[bestIdx].y + oY;
                s.car.angle = angle;

                s.car.falling = false;
                s.car.vy = 0;
                s.playing = true;
                s.car.finished = false;

                console.log('startPlay: attached at bestIdx', { bestIdx, playProgress: s.playProgress, car: { x: s.car.x, y: s.car.y } });
            } else {
                // no suitable attach point -> fall
                console.log('startPlay: no attach point at all -> falling', { pathLen: s.path.length }); //28-01//
                s.playing = true; // 31-01: Game is active even if falling
                s.playProgress = 0;
                s.car.finished = false;
                s.car.falling = true;
                s.car.vy = 0;
                if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
                setMode('play');
                setGameStarted(true);
                return;
            }
        }


        // Finalize start
        s.startTime = Date.now();
        finishAlertShown.current = false;
        setMode('play');
        setGameStarted(true);
        setShowNextLevel(false);
        // setScore(0)

        // ensure animation loop runs
        if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
    }, [currentLevel, currentConfig]);

    // ---------- followPath (replace your current one) ----------
    // first line pachi space hase to car ne break kari dese
    // function followPath(progress, path, groundY = Infinity) {
    //     if (!Array.isArray(path) || path.length < 2) return null;

    //     // ---- tunables ----
    //     const JOIN_EPS = 4;
    //     const SNAP_DIST = 24;
    //     const MAX_VERTICAL_SNAP = 20;
    //     const TIME_SCALE = 70;
    //     const HORIZ_SPEED = 140;
    //     const LAUNCH_VY = 0;
    //     const GRAVITY = 120;

    //     const SIM_DT = 1 / 120;
    //     const MAX_SIM_TIME = 5;
    //     const LANDING_EPS = 16;
    //     const APPROACH_ALLOWANCE = 6;

    //     // ---- find first stroke length (stop at break) ----
    //     let firstStrokeLength = 0;
    //     let breakIndex = -1; // index i where path[i+1].break === true
    //     for (let i = 0; i < path.length - 1; i++) {
    //         const a = path[i], b = path[i + 1];
    //         if (b && b.break) { breakIndex = i; break; }
    //         firstStrokeLength += Math.hypot(b.x - a.x, b.y - a.y);
    //     }

    //     // If still on first stroke -> interpolate
    //     if (progress <= firstStrokeLength) {
    //         let p = progress;
    //         for (let i = 0; i < path.length - 1; i++) {
    //             const a = path[i], b = path[i + 1];
    //             if (b && b.break) break;
    //             const L = Math.hypot(b.x - a.x, b.y - a.y);
    //             if (p <= L) {
    //                 const t = L === 0 ? 0 : p / L;
    //                 const x = a.x + (b.x - a.x) * t;
    //                 const y = a.y + (b.y - a.y) * t;
    //                 const angle = Math.atan2(b.y - a.y, b.x - a.x);
    //                 return { x, y, angle, falling: false, finished: false, visible: true, progress };
    //             }
    //             p -= L;
    //         }
    //     }

    //     // After first stroke -> fall/jump logic
    //     const fallProgress = progress - firstStrokeLength;

    //     // last point on first stroke and prev for direction
    //     let lastOnStroke = null;
    //     let prevToLast = null;
    //     if (breakIndex >= 0) {
    //         lastOnStroke = path[breakIndex];
    //         prevToLast = path[breakIndex - 1] || null;
    //     } else {
    //         lastOnStroke = path[path.length - 1];
    //         prevToLast = path[path.length - 2] || null;
    //     }

    //     // next stroke start index
    //     const nextIndex = (breakIndex >= 0) ? breakIndex + 1 : -1;
    //     const nextPt = (nextIndex >= 0 && nextIndex < path.length) ? path[nextIndex] : null;

    //     // gap distance between strokes
    //     let distOffset = 0;
    //     if (nextPt) distOffset = Math.hypot(nextPt.x - lastOnStroke.x, nextPt.y - lastOnStroke.y);

    //     // progress along next stroke (distance) - clamp >= 0
    //     let nextStrokeProgress = Math.max(0, fallProgress - distOffset);

    //     // helper to compute distance along a stroke from its start index to a point on segment segIndex (x,y)
    //     function distanceOnStroke(path, strokeStartIndex, segIndex, x, y) {
    //         let dist = 0;
    //         // sum full segments from strokeStartIndex up to segIndex-1
    //         for (let i = strokeStartIndex; i < segIndex; i++) {
    //             const a = path[i], b = path[i + 1];
    //             if (!a || !b) break;
    //             // if b.break occurs, it means stroke ended earlier; don't sum beyond
    //             if (b && b.break) break;
    //             dist += Math.hypot(b.x - a.x, b.y - a.y);
    //         }

    //         // add partial inside segIndex (from a to (x,y))
    //         const a = path[segIndex];
    //         const b = path[segIndex + 1];
    //         if (!a || !b) return dist;
    //         const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    //         const partial = Math.hypot(x - a.x, y - a.y);
    //         // clamp partial to [0, segLen]
    //         const clampedPartial = Math.max(0, Math.min(partial, segLen));
    //         dist += clampedPartial;
    //         return dist;
    //     }

    //     // 2A) tiny join -> direct continuation
    //     if (nextPt) {
    //         const dxn = nextPt.x - lastOnStroke.x;
    //         const dyn = nextPt.y - lastOnStroke.y;
    //         const distToNext = Math.hypot(dxn, dyn);

    //         if (distToNext <= JOIN_EPS) {
    //             let p = nextStrokeProgress;
    //             for (let i = nextIndex; i < path.length - 1; i++) {
    //                 const a = path[i], b = path[i + 1];
    //                 if (b && b.break) break;
    //                 const L = Math.hypot(b.x - a.x, b.y - a.y);
    //                 if (p <= L) {
    //                     const t = L === 0 ? 0 : p / L;
    //                     const x = a.x + (b.x - a.x) * t;
    //                     const y = a.y + (b.y - a.y) * t;
    //                     const angle = Math.atan2(b.y - a.y, b.x - a.x);
    //                     const totalProgress = firstStrokeLength + (distToNext) + p;
    //                     return { x, y, angle, falling: false, finished: false, visible: true, progress: totalProgress };
    //                 }
    //                 p -= L;
    //             }
    //             const last = path[path.length - 1];
    //             return { x: last.x, y: last.y, angle: 0, falling: false, finished: true, visible: true, progress: firstStrokeLength + distOffset };
    //         }

    //         // forgiving snap
    //         if (distToNext <= SNAP_DIST && Math.abs(dyn) <= MAX_VERTICAL_SNAP && dyn >= -MAX_VERTICAL_SNAP) {
    //             let p = nextStrokeProgress;
    //             for (let i = nextIndex; i < path.length - 1; i++) {
    //                 const a = path[i], b = path[i + 1];
    //                 if (b && b.break) break;
    //                 const L = Math.hypot(b.x - a.x, b.y - a.y);
    //                 if (p <= L) {
    //                     const t = L === 0 ? 0 : p / L;
    //                     const x = a.x + (b.x - a.x) * t;
    //                     const y = a.y + (b.y - a.y) * t;
    //                     const angle = Math.atan2(b.y - a.y, b.x - a.x);
    //                     const landedDist = distanceOnStroke(path, nextIndex, i, x, y);
    //                     const totalProgress = firstStrokeLength + distOffset + landedDist;
    //                     return { x, y, angle, falling: false, finished: false, visible: true, progress: totalProgress };
    //                 }
    //                 p -= L;
    //             }
    //             const last = path[path.length - 1];
    //             const landedDist = distanceOnStroke(path, nextIndex, path.length - 2, last.x, last.y);
    //             return { x: last.x, y: last.y, angle: 0, falling: false, finished: true, visible: true, progress: firstStrokeLength + distOffset + landedDist };
    //         }
    //     }

    //     // 2C) physics jump/fall from lastOnStroke
    //     let dirX = 1, dirY = 0;
    //     if (prevToLast) {
    //         const dx = lastOnStroke.x - prevToLast.x;
    //         const dy = lastOnStroke.y - prevToLast.y;
    //         const norm = Math.hypot(dx, dy) || 1;
    //         dirX = dx / norm;
    //         dirY = dy / norm;
    //     }

    //     const vx = dirX * HORIZ_SPEED;
    //     const vy0 = -LAUNCH_VY;

    //     const elapsedSec = Math.max(0, fallProgress / TIME_SCALE);
    //     const simMaxT = Math.min(MAX_SIM_TIME, elapsedSec + SIM_DT);

    //     if (nextIndex >= 0) {
    //         let bestCollision = null;
    //         const maxSteps = Math.ceil(simMaxT / SIM_DT);
    //         for (let step = 0; step <= maxSteps; step++) {
    //             const t = step * SIM_DT;
    //             if (t > simMaxT) break;
    //             const x_t = lastOnStroke.x + vx * t;
    //             const y_t = lastOnStroke.y + vy0 * t + 0.5 * GRAVITY * t * t;

    //             if (y_t >= groundY) break;

    //             for (let i = nextIndex; i < path.length - 1; i++) {
    //                 const a = path[i], b = path[i + 1];
    //                 if (!a || !b) continue;

    //                 const sx = b.x - a.x;
    //                 const sy = b.y - a.y;
    //                 const segLen2 = sx * sx + sy * sy || 1;
    //                 const vxToP_x = x_t - a.x;
    //                 const vxToP_y = y_t - a.y;
    //                 const proj = (vxToP_x * sx + vxToP_y * sy) / segLen2;

    //                 if (proj < 0 || proj > 1) {
    //                     // outside this segment
    //                 } else {
    //                     const cx = a.x + proj * sx;
    //                     const cy = a.y + proj * sy;
    //                     const dist = Math.hypot(x_t - cx, y_t - cy);

    //                     if (dist <= LANDING_EPS && y_t <= cy + Math.max(APPROACH_ALLOWANCE, LANDING_EPS)) {
    //                         const angle = Math.atan2(sy, sx);
    //                         if (!bestCollision || t < bestCollision.t) {
    //                             bestCollision = { t, segIndex: i, sx: cx, sy: cy, angle };
    //                         }
    //                     }
    //                 }

    //                 if (b && b.break) {
    //                     // don't check segments after this break
    //                     break;
    //                 }
    //             }

    //             if (bestCollision && bestCollision.t <= t) break;
    //         }

    //         if (bestCollision && bestCollision.t <= simMaxT) {
    //             // compute distance along next stroke where we landed
    //             const landedDist = distanceOnStroke(path, nextIndex, bestCollision.segIndex, bestCollision.sx, bestCollision.sy);
    //             const totalProgress = firstStrokeLength + distOffset + landedDist;

    //             return {
    //                 x: bestCollision.sx,
    //                 y: bestCollision.sy,
    //                 angle: bestCollision.angle,
    //                 falling: false,
    //                 finished: false,
    //                 visible: true,
    //                 progress: totalProgress
    //             };
    //         }
    //     }

    //     // No collision found up to this progress: return free-fall position at elapsedSec
    //     const t = elapsedSec;
    //     const x = lastOnStroke.x + vx * t;
    //     const y = lastOnStroke.y + vy0 * t + 0.5 * GRAVITY * t * t;
    //     const vy = vy0 + GRAVITY * t;
    //     const angle = Math.atan2(vy, vx);

    //     if (y >= groundY) {
    //         return { x: lastOnStroke.x, y: groundY, angle: Math.PI / 2, falling: false, finished: true, visible: false, progress: firstStrokeLength + distOffset };
    //     }

    //     return { x, y, angle, falling: true, finished: false, visible: true, vx, vy, progress: firstStrokeLength + Math.max(0, fallProgress) };
    // }

    function followPath(progress, path) {
        if (!Array.isArray(path) || path.length < 2) return null;
        let accumulatedDist = 0;
        const carOffset = -30;

        for (let i = 0; i < path.length - 1; i++) {
            const p1 = path[i];
            const p2 = path[i + 1];
            const segDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

            if (p2.break) {
                // Gap segment: treat as distance but return null (airborne) during this range
                const gapLen = segDist || 5;
                if (progress >= accumulatedDist && progress < accumulatedDist + gapLen) {
                    return null;
                }
                accumulatedDist += gapLen;
                continue;
            }

            if (progress <= accumulatedDist + segDist) {
                const t = (progress - accumulatedDist) / (segDist || 1);
                const x = p1.x + (p2.x - p1.x) * t;
                const y = p1.y + (p2.y - p1.y) * t;
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

                return {
                    x: x + (-Math.sin(angle) * carOffset),
                    y: y + (Math.cos(angle) * carOffset),
                    angle,
                    falling: false,
                    finished: false,
                    visible: true,
                    progress: progress
                };
            }
            accumulatedDist += segDist;
        }

        // Snap to endpoint if we're near or past it
        const last = path[path.length - 1];
        const lastAngle = path.length >= 2 ? Math.atan2(last.y - path[path.length - 2].y, last.x - path[path.length - 2].x) : 0;

        return {
            x: last.x + (-Math.sin(lastAngle) * carOffset),
            y: last.y + (Math.cos(lastAngle) * carOffset),
            angle: lastAngle,
            falling: false,
            finished: true,
            visible: true,
            progress: accumulatedDist
        };
    }

    function aabb(a, b) {
        return !(
            a.x + a.w < b.x ||
            a.x > b.x + b.w ||
            a.y + a.h < b.y ||
            a.y > b.y + b.h
        );
    }

    function getTopObstacleUnderCar(car, obstacles) {
        const carW = car.w || 75;
        const carH = car.h || 50;
        for (let o of obstacles) {
            // Horizontal overlap
            if (car.x + carW / 2 > o.x && car.x - carW / 2 < o.x + o.w) {
                // Vertical check: car bottom is slightly above or at the top of obstacle
                if (car.y + 35 >= o.y - 10 && car.y + 35 <= o.y + 20) {
                    return o;
                }
            }
        }
        return null;
    }



    function loop(ts) {
        const s = stateRef.current;


        // Time delta
        if (!s.lastTime) s.lastTime = ts;
        let dt = (ts - s.lastTime) / 1000;
        if (dt > 0.1) dt = 0.016; // Cap delta to avoid teleporting if tab was hidden
        s.lastTime = ts;

        // 🔁 Capture position AT START of frame for motion detection
        s.car.lastX = s.car.x;
        s.car.lastY = s.car.y;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // --- 1. PREPARE CANVAS (Clear once per frame) ---
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = currentConfig?.bgColor ?? '#fff';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        drawGrid(ctx);


        // --- 1. RE-ESTABLISH STATE ---
        const config = currentConfig;
        const obstacles = config?.obstacles ?? [];
        const GRAVITY = 1200;

        // Reset Car Defaults
        if (s.car.vy === undefined) s.car.vy = 0;
        if (s.car.vx === undefined) s.car.vx = 0;
        if (s.playSpeed === undefined) s.playSpeed = 120;
        if (!Array.isArray(s.path)) s.path = [];

        // --- 2. MOVE OBSTACLES ---
        obstacles.forEach(o => {
            if (o.moving) {
                if (o.dx) {
                    o.x += o.dx;
                    if (o.xRange && (o.x < o.xRange[0] || o.x > o.xRange[1])) {
                        if (o.bidir) o.dx *= -1;
                        else o.x = o.xRange[0];
                    }
                }
                if (o.dy) {
                    o.y += o.dy;
                    if (o.yRange && (o.y < o.yRange[0] || o.y > o.yRange[1])) {
                        if (o.bidir) o.dy *= -1;
                        else o.y = o.yRange[0];
                    }
                }
            }
        });

        // --- 3. HANDLE WINNER ANIMATION & FINISH ---
        if (!s.car.finished) {
            const dx = s.car.x - s.finish.x;
            const dy = s.car.y - s.finish.y;
            const FINISH_RADIUS = 35; // Slightly larger for easier detection

            if (Math.hypot(dx, dy) <= FINISH_RADIUS) {
                // 🚗 Car ને finish point પર ઊભી રાખો
                s.car.finished = true;
                s.playing = false;
                s.car.x = s.finish.x; // Car finish position પર stop
                s.car.y = s.finish.y;
                s.car.vy = 0;
                s.car.vx = 0;
                s.car.falling = false;
                s.car.visible = true;
                s.car.angle = 0; // Car straight position માં

                // 🎉 Winner Animation Trigger
                finishConfetti = [];
                finishAnimActive = true;
                finishPhase = 0;
                finishTimer = 0;
                finishHold = true;
                winnerScale = 0;
                winnerAlpha = 1;
                spawnFinishBlast(WIDTH, HEIGHT);
                setTimeout(() => setShowLevelComplete(true), 1400);
            }
        }


        // --- 4. GAMEPLAY LOGIC --- 
        if (s.playing && !s.car.finished && !s.gameOver) {



            // ⛽ Petrol Pump Collection
            const pumps = Array.isArray(config.petrolPump) ? config.petrolPump : (config.petrolPump ? [config.petrolPump] : []);
            pumps.forEach(p => {
                if (!p.used && checkPetrolPumpCollision(s.car, p)) {
                    p.used = true;
                    s.car.fuel = s.car.maxFuel;
                }
            });

            // Path Following vs Physics
            let pos = followPath(s.playProgress, s.path);

            if (pos && !s.car.falling) {
                // 🛑 CHECK: Did we reach the end of the line? // 04-02 --carjump//
                if (pos.finished && !s.car.finished) {
                    // Line ended -> Start physics jump!
                    s.car.falling = true;
                    s.car.leftPath = true; // Mark as left path

                    const speed = s.playSpeed || 120;
                    s.car.vx = Math.cos(s.car.angle) * speed;
                    s.car.vy = Math.sin(s.car.angle) * speed; // Preserve vertical momentum
                } else {
                    // GROUNDED ON PATH
                    s.car.x = pos.x;
                    s.car.y = pos.y;
                    s.car.angle = pos.angle;
                    s.playProgress += s.playSpeed * dt;
                }
            } else {
                // AIRBORNE or ON OBSTACLE
                if (!s.car.falling) {
                    // Start a jump/fall impulse
                    s.car.falling = true;
                    const speed = s.playSpeed || 120;
                    s.car.vx = Math.cos(s.car.angle) * speed;
                    s.car.vy = Math.sin(s.car.angle) * speed - 150; // Slight up-kick
                }

                // Physics params
                const AIR_DRAG = 0.5;
                const STOP_UPDATE_BELOW = HEIGHT + 100;

                // Integrate
                s.car.vy += GRAVITY * dt;
                s.car.vx *= Math.max(0, 1 - AIR_DRAG * dt);
                s.car.x += (s.car.vx || 0) * dt;
                s.car.y += s.car.vy * dt;

                // 🔄 Rotate car to follow velocity (Nose dive effect) //04-02 --carjump//
                if (s.car.falling && Math.hypot(s.car.vx, s.car.vy) > 10) {
                    s.car.angle = Math.atan2(s.car.vy, s.car.vx);
                }

                // Landing on Top of Obstacle
                const under = getTopObstacleUnderCar(s.car, obstacles);
                if (under && (s.car.y + 30) >= under.y && s.car.vy >= 0) {
                    s.car.y = under.y - 30;
                    s.car.vy = 0;
                    s.car.vx = s.playSpeed || 100; // Move forward on top
                    s.car.angle = 0; // Reset angle on flat obstacle // 04-02 --carjump//
                }

                // Landing on Path
                if (s.car.vy >= 0 && s.path.length > 1) {
                    let totalDist = 0;
                    for (let i = 0; i < s.path.length - 1; i++) {
                        const p1 = s.path[i], p2 = s.path[i + 1];
                        const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                        if (p2.break) { totalDist += (segLen || 5); continue; }

                        // Bounds check
                        const minX = Math.min(p1.x, p2.x) - 50;
                        const maxX = Math.max(p1.x, p2.x) + 50;
                        if (s.car.x >= minX && s.car.x <= maxX) {
                            const t = (s.car.x - p1.x) / (p2.x - p1.x || 1);
                            if (t >= 0 && t <= 1) {
                                const yOnLine = p1.y + t * (p2.y - p1.y);
                                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

                                // Perfect alignment: wheels touch the line
                                // Matches the followPath center calculation exactly
                                const carOffset = -30;
                                const targetY = yOnLine + Math.cos(angle) * carOffset;
                                const targetX = (p1.x + t * (p2.x - p1.x)) + (-Math.sin(angle) * carOffset);

                                // Check vertical landing window
                                if (s.car.y >= targetY - 40 && s.car.y <= targetY + 20) {
                                    s.car.x = targetX;
                                    s.car.y = targetY;
                                    s.car.angle = angle;
                                    s.car.falling = false;
                                    s.car.vy = 0;
                                    s.car.vx = 0;
                                    s.playProgress = totalDist + segLen * t;
                                    break;
                                }
                            }
                        }
                        totalDist += segLen;
                    }
                }

                // Game Over if fell off screen
                if (s.car.y >= STOP_UPDATE_BELOW) {
                    s.playing = false;
                    s.gameOver = true;
                    s.car.visible = false;
                    if (!s.car.finished) setShowGameOver(true);
                }
            }

            // ⛽ Fuel Drain & 🏆 Score Increment while moving (AFTER position update) // 04-02 --fuelworking//
            if (isCarReallyMoving(s.car)) {
                s.car.fuel -= s.car.fuelDrainRate * dt * 60;

                // 🏆 Real-time score increment while car is moving
                if (!s.scoreAccumulator) s.scoreAccumulator = 0;
                s.scoreAccumulator += dt * 10; // Accumulate score over time
                if (s.scoreAccumulator >= 1) {
                    const pointsToAdd = Math.floor(s.scoreAccumulator);
                    setScore(prev => prev + pointsToAdd);
                    s.scoreAccumulator -= pointsToAdd;
                }

                if (s.car.fuel <= 0) {
                    s.car.fuel = 0;
                    s.playing = false;
                    s.car.falling = true;
                    if (!s.car.finished && !finishAlertShown.current) setShowGameOver(true);
                }
            }
        }


        // --- 5. RENDER STAGE ---
        drawObstacles(ctx, obstacles);

        const pumps = Array.isArray(config.petrolPump) ? config.petrolPump : (config.petrolPump ? [config.petrolPump] : []);
        pumps.forEach(p => drawPetrolPump(ctx, p));

        if (s.path && s.path.length > 0) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = config?.pathColor ?? '#f55';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            s.path.forEach((p, i) => {
                if (p.break || i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
        }

        drawCheckeredFlag(ctx, s.finish.x, s.finish.y, s.finish.w);

        if (s.car.visible) {
            drawCar(ctx, s.car.x, s.car.y, s.car.angle);
            drawFuelBar(ctx, s.car);
        }

        // --- 6. ANIMATIONS (Confetti / Winner) ---
        if (finishAnimActive) {
            // Update & Draw Confetti
            for (let i = finishConfetti.length - 1; i >= 0; i--) {
                const p = finishConfetti[i];
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.15; p.vx *= 0.98; p.vy *= 0.98;
                p.life -= 1;
                if (p.life <= 0) { finishConfetti.splice(i, 1); continue; }

                const alpha = p.life / p.maxLife;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = p.color;
                ctx.strokeStyle = p.color;
                if (p.line) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x - p.vx * 4, p.y - p.vy * 4);
                    ctx.stroke();
                } else {
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                }
            }
            ctx.globalAlpha = 1;

            // Winner Text
            winnerPulse += 0.08;
            const pulse = 1 + Math.sin(winnerPulse) * 0.06;
            if (winnerScale < 1) winnerScale = Math.min(1, winnerScale + 0.05);
            if (winnerGlow < 40) winnerGlow += 2;

            ctx.save();
            ctx.translate(WIDTH / 2, HEIGHT / 2 - 40);
            ctx.scale(winnerScale * pulse, winnerScale * pulse);
            ctx.globalAlpha = winnerAlpha;
            ctx.shadowColor = 'rgba(255, 215, 100, 0.9)';
            ctx.shadowBlur = winnerGlow;

            const grad = ctx.createLinearGradient(0, -50, 0, 50);
            grad.addColorStop(0, '#fff4a3'); grad.addColorStop(1, '#c88900');
            ctx.fillStyle = grad;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = '900 78px Poppins, Arial';
            ctx.fillText('WINNER!', 0, 0);
            ctx.restore();
            ctx.globalAlpha = 1;

            finishTimer += dt * 60;
        }

        // --- 7. CONTINUITY ---
        rafRef.current = requestAnimationFrame(loop);
    }




    useEffect(() => {
        // React Ref માંથી canvas element લે છે.
        // જો canvas ના મળે તો function return થઈ જાય.
        const canvas = canvasRef.current;
        if (!canvas) return;

        // canvas ને game માટે preset width/height આપે છે.
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        // 2D drawing કરવા માટે context મળે છે.
        const ctx = canvas.getContext('2d');

        // Rectangular વિસ્તાર clear કરે છે (પૂરેપૂરો canvas સાફ).
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // level મુજબ background color set કરે છે.
        // Full canvas ને એ રંગથી ભરાઈ જાય છે.
        ctx.fillStyle = currentConfig.bgColor;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        drawGrid(ctx);
        const s = stateRef.current;

        // 20-12//
        // ⭐⭐ ADD THIS BLOCK EXACTLY HERE ⭐⭐
        // s.car.visible = true;
        // s.car.falling = false;
        // s.car.finished = false;
        // s.car.justRefueled = false;
        // s.car.fuel = s.car.maxFuel;


        // finish point બતાવવા માટે chequered flag draw કરે છે.
        drawCheckeredFlag(ctx, s.finish.x, s.finish.y, s.finish.w);

        // કારને તેની X,Y position અને angle પ્રમાણે draw કરે છે.
        if (s.car.visible) {
            drawCar(ctx, s.car.x, s.car.y, s.car.angle);
        }
        if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);

        // Level બદલાય ત્યારે જૂનો animation loop બંધ કરી દે છે.
        // Memory leak અટકાવે છે.
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };

    }, [currentLevel]);


    // લેવલને ફરીથી start કરવાની process કરે
    const restartLevel = () => {
        const config = LEVEL_CONFIGS[currentLevel - 1],
            s = stateRef.current;

        // 13-01 🔁 Finish animation reset
        finishConfetti = [];
        finishOverlayAlpha = 0;
        finishAnimActive = false;
        finishPhase = 0;
        finishTimer = 0;
        finishHold = false;

        // 🏆 Winner text reset
        winnerScale = 0;
        winnerAlpha = 1;
        winnerGlow = 0;
        winnerPulse = 0;
        showNextBanner = false;


        s.path = [];

        s.playing = false;
        s.playProgress = 0;

        s.path.length = 0;
        s.car.x = config.carStart.x;
        s.car.y = config.carStart.y;
        s.car.angle = 0;
        s.car.finished = false;
        s.car.falling = false;
        s.car.fallSpeed = 0;
        s.car.visible = true;
        s.car.isMoving = true; // 13-01//

        s.car.dead = false;   // 16-01 -- car restart moving //
        s.car.vx = 0;         // 16-01 -- car restart moving //
        s.car.vy = 0;       // 16-01  -- car restart moving//
        s.gameOver = false;   // 16-01 -- car restart moving //



        s.lastGridX = undefined;
        s.lastGridY = undefined;

        finishAlertShown.current = false;


        // ✅ THIS FIXES GREEN BAR ISSUE // 27-12//
        s.car.fuel = s.car.maxFuel;

        // 10-01 ✅ RESET PETROL PUMP - Reset all pumps' used status--petrolpump bug//
        if (config.petrolPump) {
            if (Array.isArray(config.petrolPump)) {
                config.petrolPump.forEach(pump => {
                    pump.used = false;
                });
            } else {
                config.petrolPump.used = false;
            }
        }

        s.lastTime = 0; // Reset timing on manual clear
        setScore(0);
        setElapsedTime(0);
        setMode('draw');
        setShowNextLevel(false);
        setGameStarted(false);
        setShowGameOver(false);  // 16-01 -- car restart moving//
        setShowLevelComplete(false); // 16-01  -- car restart moving//
        setShowGameOver(false); // 28-01 --gameover//
    };


    const goToNextLevel = () => {
        // 🔄 Reset winner animation when going to next level
        finishConfetti = [];
        finishOverlayAlpha = 0;
        finishAnimActive = false;
        finishPhase = 0;
        finishTimer = 0;
        finishHold = false;
        winnerScale = 0;
        winnerAlpha = 1;
        winnerGlow = 0;
        winnerPulse = 0;
        showNextBanner = false;

        // Reset UI states
        setShowLevelComplete(false);
        setShowNextLevel(false);

        if (currentLevel < 25) setCurrentLevel((prev) => prev + 1);
        else alert('🏆 Congratulations! You completed all levels!');
        setMode('draw');
    };

    // const selectLevel = (level) => {
    //     setCurrentLevel(level);
    //     setShowLevelSelect(false);
    // };

    return (
        <div className="game-container">
            <div className="container-fluid p-0 d-flex justify-content-center">
                <div className="game-card">


                    <div className={`canvas-wrapper ${isMobile ? 'mb-2' : 'mb-4'} position-relative`}>
                        <div className="level-hud-container">
                            <div className="level-hud-pill">
                                {/* LEVEL */}
                                <div className="hud-section">
                                    <div className="hud-icon-circle purple">
                                        <Star fill="white" color="white" size={isMobile ? 16 : 22} />
                                    </div>
                                    <div className="hud-text-group">
                                        <span className="hud-label">LEVEL</span>
                                        <span className="hud-value">{currentLevel.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>

                                <div className="hud-divider"></div>

                                {/* SCORE */}
                                <div className="hud-section">
                                    <div className="hud-text-group">
                                        <span className="hud-label score-label">SCORE</span>
                                        <span className="hud-value score-value">{score}</span>
                                    </div>
                                    <div className="hud-icon-circle orange">
                                        <Trophy fill="white" color="white" size={isMobile ? 16 : 22} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* 13-01 <canvas ref={canvasRef} data-testid="game-canvas" />*/}


                        {/* <canvas
                            ref={canvasRef}
                            width={WIDTH}
                            height={HEIGHT}
                            style={{
                                width: "100%",
                                maxWidth: "100%",

                                maxHeight: "calc(100vh - 200px)",
                                // height: "auto",
                                height: 800,
                                aspectRatio: "1250 / 600",
                                display: "block",
                                margin: "0 auto",
                                touchAction: "none"
                            }}
                        /> */}

                        {/*22-01*/}
                        <div className="game-wrapper">
                            <canvas
                                ref={canvasRef}
                                width={WIDTH}
                                height={HEIGHT}
                                className="game-canvas"
                            />
                            {/* 🌟 LEVEL COMPLETE POPUP */}
                            {showLevelComplete && (
                                <div className="lc-overlay">
                                    <div className="lc-box">
                                        {/* Sparkle Icon */}
                                        <div className="lc-sparkle-container">
                                            <div className="lc-sparkle-wrapper">
                                                <div className="lc-sparkle-icon">✨</div>
                                                <div className="lc-sparkle-ring"></div>
                                            </div>
                                        </div>

                                        {/* Banner */}
                                        {/* Banner */}
                                        {/* Banner */}
                                        <div className="lc-banner">LEVEL {currentLevel.toString().padStart(2, '0')} COMPLETE</div>
                                        <div className="lc-subtitle">
                                            Amazing work! You're unstoppable!
                                        </div>

                                        {/* 28-01 🏆 Score Display */}
                                        <div className="lc-score-display">
                                            <div className="lc-score-label">SCORE</div>
                                            <div className="lc-score-value">{score}</div>
                                        </div>

                                        {/* Stars */}
                                        <div className="lc-stars">
                                            <div className="lc-star-wrapper">
                                                <span className="lc-star">⭐</span>
                                                <span className="lc-star-ping">⭐</span>
                                            </div>
                                            <div className="lc-star-wrapper">
                                                <span className="lc-star">⭐</span>
                                                <span className="lc-star-ping">⭐</span>
                                            </div>
                                            <div className="lc-star-wrapper">
                                                <span className="lc-star">⭐</span>
                                                <span className="lc-star-ping">⭐</span>
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        <div className="lc-buttons">
                                            <button className="lc-next" onClick={() => {
                                                setShowLevelComplete(false);
                                                goToNextLevel();
                                            }}>
                                                NEXT LEVEL ➜
                                            </button>
                                            <button className="lc-restart" onClick={() => {
                                                setShowLevelComplete(false);
                                                restartLevel();
                                            }}>
                                                ↻ RETRY LEVEL
                                            </button>
                                        </div>

                                        {/* Floating Sparkles */}
                                        <div className="lc-floating-sparkles">
                                            <span className="lc-floating-sparkle">⭐</span>
                                            <span className="lc-floating-sparkle">⭐</span>
                                            <span className="lc-floating-sparkle">⭐</span>
                                            <span className="lc-floating-sparkle">⭐</span>
                                            <span className="lc-floating-sparkle">⭐</span>
                                            <span className="lc-floating-sparkle">⭐</span>
                                            <span className="lc-floating-sparkle">⭐</span>
                                            <span className="lc-floating-sparkle">⭐</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 28-01 --gameover */}
                            {showGameOver && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        background: "rgba(0,0,0,0.7)",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#fff",
                                        zIndex: 999,
                                    }}
                                >
                                    <h1 style={{ color: "#ff4d4d", marginBottom: 20 }}>
                                        GAME OVER
                                    </h1>

                                    <button
                                        className="btn btn-warning px-4 py-2"
                                        onClick={() => {
                                            setShowGameOver(false);
                                            restartLevel(); // 🔁 Properly reset the current level and fuel
                                        }}
                                    >
                                        Restart
                                    </button>
                                </div>
                            )}

                        </div>



                        {/* Overlay Controls */}
                        <div className={`canvas-overlay-controls ${gameStarted ? 'game-active-controls' : ''}`}>
                            {!gameStarted ? (
                                !isMobile && (
                                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                                        <button onClick={() => setMode('draw')} className={`btn btn-info btn-game ${mode === 'draw' ? 'active' : ''}`} data-testid="draw-btn">Draw</button>
                                        <button onClick={startPlay} className="btn btn-success btn-game" data-testid="start-btn">Start</button>
                                        <button onClick={restartLevel} className="btn btn-danger btn-game" data-testid="clear-btn">Clear</button>
                                    </div>
                                )
                            ) : (
                                <div className={`bottom-tools ${showLevelComplete ? 'hide-tools' : ''}`}>
                                    <div className="d-flex align-items-center">
                                        {/* 🔄 RESTART BUTTON */}
                                        <button onClick={restartLevel} className="btn-icon-styled btn-restart-styled" title="Restart" data-testid="restart-btn">
                                            <div className="icon-inner">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 12C4 16.4183 7.58172 20 12 20C14.7359 20 17.1524 18.6256 18.621 16.5M4 12C4 7.58172 7.58172 4 12 4C14.4446 4 16.6347 5.09706 18.125 6.875M4 12V6M18.125 6.875V3M18.125 6.875H13.625" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        {/* ✏️ ERASER BUTTON */}
                                        <button onClick={restartLevel} className="btn-icon-styled btn-eraser-styled" title="Eraser" data-testid="eraser-btn">
                                            <div className="icon-inner">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M15.232 5.23233L18.768 8.76833M16.732 3.73233C17.2009 3.26343 17.8369 3 18.5 3C19.1631 3 19.7991 3.26343 20.268 3.73233C20.7369 4.20123 21.0003 4.8372 21.0003 5.50033C21.0003 6.16346 20.7369 6.79943 20.268 7.26833L6.5 21.0323H3V17.5323L16.732 3.73233Z" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>
                                    </div>

                                    {showNextLevel && !showLevelComplete && (
                                        <button onClick={goToNextLevel} className="btn btn-next ms-auto" data-testid="next-level-btn">
                                            {currentLevel < 25 ? 'NEXT LEVEL ▶' : '🏆 COMPLETED!'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mobile Controls - Horizontal Tool Bar (Moved Inside) */}
                        {isMobile && !gameStarted && (
                            <div className="mobile-tool-bar">
                                <button
                                    onClick={() => setMode('draw')}
                                    className={`tool-btn draw-btn ${mode === 'draw' ? 'active' : ''}`}
                                >
                                    <div className="icon-circle">
                                        <Pencil size={14} />
                                    </div>
                                    <span>Draw</span>
                                </button>

                                <button
                                    onClick={startPlay}
                                    className="tool-btn start-btn"
                                >
                                    <div className="icon-circle">
                                        <Rocket size={14} />
                                    </div>
                                    <span>Start</span>
                                </button>

                                <button
                                    onClick={restartLevel}
                                    className="tool-btn clear-btn"
                                >
                                    <div className="icon-circle">
                                        <Trash2 size={14} />
                                    </div>
                                    <span>Clear</span>
                                </button>
                            </div>
                        )}

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

                </div >
            </div >
        </div >
    );
}