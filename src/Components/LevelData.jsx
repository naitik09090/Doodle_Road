import React, { useRef, useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import fuelIcon from "../assets/fuel.png"


const fuelImg = new Image();
fuelImg.src = fuelIcon;

fuelImg.onload = () => {
    console.log("Fuel icon loaded");
};




// કેનવાસનું size
// const WIDTH = 1200;
// const HEIGHT = 600;

// 21-01 🎯 Base Canvas Size
const BASE_WIDTH = 1250;
const BASE_HEIGHT = 600;

// 🎯 Game Canvas Size (use everywhere)
const WIDTH = BASE_WIDTH;
const HEIGHT = BASE_HEIGHT;


// 24-12 -- animation//
let finishConfetti = [];
let finishOverlayAlpha = 0;
let finishAnimActive = false;
let finishPhase = 0;      // 0 = bright, 1 = dark
let finishTimer = 0;
let finishHold = false;     // 🔒 animation lock until click
//let burstCooldown = 0;   // 🔥 controlled extra bursts


// 26-12 --winner//z
// // // 🏆 WINNER TEXT
let winnerScale = 0;
let winnerAlpha = 1;
let winnerGlow = 0;
let winnerPulse = 0;
let showNextBanner = false;  // 31-12//

function spawnFinishBlast(WIDTH, HEIGHT) {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;

    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 6;

        finishConfetti.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 160,
            maxLife: 160,
            size: Math.random() * 6 + 4, // 🔥 BIGGER
            color: `hsl(${Math.random() * 360}, 100%, 65%)`,
            line: Math.random() > 0.3
        });
    }
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

        // obstacles: []
        speedBoost: [
            { x: 500, y: 250, r: 24, multiplier: 2, duration: 3000 },
            // { x: 800, y: 250, r: 24, multiplier: 3, duration: 2000 },
        ]
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
        playSpeed: 100,
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
        playSpeed: 100,
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
        carStart: { x: 150, y: HEIGHT - 300 },
        finishPos: { x: WIDTH - 100, y: HEIGHT - 100 },
        playSpeed: 100,
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
        playSpeed: 100,
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
        playSpeed: 120,
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
        playSpeed: 100,
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
        playSpeed: 100,
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
            { x: 300, y: 200, w: 80, h: 80 },
            { x: 500, y: 120, w: 80, h: 80 },
            { x: 600, y: 350, w: 80, h: 80 },
            { x: 850, y: 250, w: 80, h: 80 }
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
            { x: 350, y: 0, w: 40, h: 220 },
            { x: 350, y: 320, w: 40, h: 200 },

            { x: 600, y: 150, w: 40, h: 300 },

            { x: 850, y: 0, w: 40, h: 250 },
            { x: 850, y: 350, w: 40, h: 200 },
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
        petrolPump: [{ x: 520, y: 320, r: 26 }],
        obstacles: [
            { x: 300, y: 120, w: 60, h: 300, moving: true, dy: 2.5, yRange: [120, 350], bidir: true },
            { x: 420, y: 200, w: 80, h: 60 },
            { x: 550, y: 280, w: 70, h: 70, moving: true, dx: 2, xRange: [500, 650], bidir: true },
            { x: 700, y: 180, w: 90, h: 60 },
            { x: 850, y: 220, w: 60, h: 60, moving: true, dy: -2.3, yRange: [150, 350], bidir: true },
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
            { x: 300, y: 80, w: 120, h: 90 },
            { x: 300, y: 260, w: 120, h: 120 },
            { x: 520, y: 240, w: 120, h: 120 },
            { x: 740, y: 120, w: 120, h: 120 },
            { x: 960, y: 360, w: 120, h: 120 },
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
            { x: 380, y: 100, w: 30, h: 420, moving: true, dx: 1.8, xRange: [380, 440], bidir: true },
            { x: 680, y: 80, w: 30, h: 440, moving: true, dx: -1.8, xRange: [640, 700], bidir: true },

            // final small moving blocker
            { x: 820, y: 260, w: 60, h: 60, moving: true, dy: 2.5, yRange: [180, 360], bidir: true },
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
            { x: 340, y: 100, w: 50, h: 420, moving: true, dy: 3.2, yRange: [120, 360], bidir: true },
            { x: 720, y: 100, w: 50, h: 420, moving: true, dy: -3.2, yRange: [120, 360], bidir: true },

            // chaotic moving pinballs
            { x: 900, y: 160, w: 70, h: 70, moving: true, dx: 3.5, xRange: [850, 980], bidir: true },
            { x: 900, y: 330, w: 70, h: 70, moving: true, dx: -3.5, xRange: [850, 980], bidir: true },
            { x: 800, y: 250, w: 60, h: 60, moving: true, dy: 3, yRange: [180, 360], bidir: true },
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
            { x: 260, y: 120, w: 640, h: 36 },
            { x: 260, y: 460, w: 640, h: 36 },

            // snake pillars (more gap + thinner)
            { x: 360, y: 210, w: 32, h: 180 },
            { x: 500, y: 150, w: 32, h: 180 },
            { x: 640, y: 210, w: 32, h: 180 },
            { x: 780, y: 150, w: 32, h: 180 }
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
            { x: 280, y: 200, w: 90, h: 90 },
            { x: 420, y: 120, w: 60, h: 220 },
            { x: 540, y: 380, w: 180, h: 32 },
            { x: 780, y: 180, w: 40, h: 260 }
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
            { x: 700, y: 270, r: 30 }
        ],
        obstacles: [
            // Small rapidly moving mines everywhere
            { x: 280, y: 180, w: 45, h: 45, moving: true, dx: 5, xRange: [250, 400], bidir: true },
            { x: 320, y: 250, w: 45, h: 45, moving: true, dy: 4.5, yRange: [200, 340], bidir: true },
            { x: 380, y: 320, w: 45, h: 45, moving: true, dx: -5, xRange: [280, 420], bidir: true },

            { x: 520, y: 160, w: 45, h: 45, moving: true, dy: -4.8, yRange: [160, 300], bidir: true },
            { x: 580, y: 360, w: 45, h: 45, moving: true, dx: 4.5, xRange: [480, 620], bidir: true },
            { x: 620, y: 220, w: 45, h: 45, moving: true, dy: 4.2, yRange: [180, 320], bidir: true },

            { x: 780, y: 180, w: 45, h: 45, moving: true, dx: -4.8, xRange: [680, 820], bidir: true },
            { x: 820, y: 280, w: 45, h: 45, moving: true, dy: -4.5, yRange: [200, 340], bidir: true },
            { x: 880, y: 340, w: 45, h: 45, moving: true, dx: 5, xRange: [780, 920], bidir: true },

            { x: 950, y: 220, w: 45, h: 45, moving: true, dy: 4.8, yRange: [180, 320], bidir: true },
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
            // { x: 640, y: HEIGHT / 2 - 30, r: 26 }
            { x: 680, y: HEIGHT / 4 - 60, r: 30 }
        ],
        obstacles: [
            // two narrow vertical walls that move closer/further
            { x: 380, y: 100, w: 30, h: 420, moving: true, dx: 1.8, xRange: [380, 440], bidir: true },
            { x: 680, y: 80, w: 30, h: 440, moving: true, dx: -1.8, xRange: [640, 700], bidir: true },

            // final small moving blocker
            { x: 820, y: 260, w: 60, h: 60, moving: true, dy: 2.5, yRange: [180, 360], bidir: true },
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
            // { x: 850, y: HEIGHT / 2 + 30, r: 30 }
            { x: 890, y: HEIGHT / 5 + 35, r: 26 }
        ],
        obstacles: [
            // static angled blockers
            { x: 300, y: 150, w: 60, h: 80 },
            { x: 400, y: 280, w: 60, h: 80 },
            { x: 500, y: 170, w: 50, h: 420, moving: true, dx: 2, xRange: [480, 580], bidir: true },
            { x: 820, y: 150, w: 60, h: 350 },
            { x: 720, y: 220, w: 70, h: 70, moving: true, dy: 2.8, yRange: [180, 360], bidir: true },
        ]
    },
    {
        level: 21,
        name: "Ultimate Refuel Gauntlet",
        carStart: { x: 130, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 160, y: HEIGHT / 2 },
        playSpeed: 125,
        bgColor: "#fff0f0",
        gridColor: "rgba(255,100,100,0.12)",
        pathColor: "#c60000",
        carColor: "#720000",
        petrolPump: [
            // { x: 720, y: HEIGHT / 2, r: 30 }
            { x: 850, y: HEIGHT / 3, r: 30 }
        ],
        obstacles: [
            { x: 340, y: 100, w: 50, h: 420, moving: true, dy: 3.2, yRange: [120, 360], bidir: true },
            { x: 720, y: 100, w: 50, h: 420, moving: true, dy: -3.2, yRange: [120, 360], bidir: true },

            // chaotic moving pinballs
            { x: 900, y: 160, w: 70, h: 70, moving: true, dx: 3.5, xRange: [850, 980], bidir: true },
            { x: 900, y: 330, w: 70, h: 70, moving: true, dx: -3.5, xRange: [850, 980], bidir: true },
            { x: 800, y: 250, w: 60, h: 60, moving: true, dy: 3, yRange: [180, 360], bidir: true },
        ]
    },
    {
        level: 22,
        name: "The Final Showdown",
        carStart: { x: 130, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 160, y: HEIGHT / 2 },
        playSpeed: 145,
        bgColor: "#1a0a0a",
        gridColor: "rgba(255,50,50,0.2)",
        pathColor: "#ff0000",
        carColor: "#cc0000",
        petrolPump: [
            { x: 880, y: 280, r: 28 }
        ],
        obstacles: [
            // ULTIMATE CHALLENGE - Everything combined
            // Rotating threats
            { x: 450, y: 180, w: 65, h: 65, moving: true, rotation: true, rotSpeed: 0.045, pivot: { x: 500, y: 230 }, radius: 80 },
            { x: 550, y: 180, w: 65, h: 65, moving: true, rotation: true, rotSpeed: -0.045, pivot: { x: 500, y: 230 }, radius: 80 },

            { x: 650, y: 320, w: 65, h: 65, moving: true, rotation: true, rotSpeed: 0.05, pivot: { x: 700, y: 370 }, radius: 80 },
            { x: 750, y: 320, w: 65, h: 65, moving: true, rotation: true, rotSpeed: -0.05, pivot: { x: 700, y: 370 }, radius: 80 },

            // Diagonal chaos
            { x: 300, y: 180, w: 55, h: 55, moving: true, dx: 5.5, dy: 4.5, xRange: [280, 450], yRange: [160, 320], bidir: true },
            { x: 350, y: 340, w: 55, h: 55, moving: true, dx: -5.2, dy: -4.2, xRange: [280, 450], yRange: [250, 380], bidir: true },

            { x: 850, y: 160, w: 60, h: 60, moving: true, dx: 5, dy: -4.8, xRange: [800, 1000], yRange: [140, 300], bidir: true },
            { x: 900, y: 350, w: 60, h: 60, moving: true, dx: -5.5, dy: 5, xRange: [800, 1000], yRange: [260, 380], bidir: true },

            // Fast vertical sweepers
            { x: 550, y: 100, w: 40, h: 380, moving: true, dy: 5.5, yRange: [100, 400], bidir: true },
            { x: 650, y: 400, w: 40, h: 380, moving: true, dy: -6, yRange: [100, 400], bidir: true },
        ]
    },
    {
        level: 23,
        name: "Laser Grid",
        carStart: { x: 130, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 160, y: HEIGHT / 2 },
        playSpeed: 160,
        bgColor: "#1a0000",
        gridColor: "rgba(255,0,0,0.2)",
        pathColor: "#ff0000",
        carColor: "#cc0000",
        petrolPump: [
            { x: 400, y: 250, r: 30 },
            { x: 700, y: 330, r: 30 },
            { x: 950, y: HEIGHT / 2, r: 30 }
        ],
        obstacles: [
            // Horizontal laser sweeps
            { x: 320, y: 170, w: 200, h: 30, moving: true, dy: 4, yRange: [140, 380], bidir: true },
            { x: 320, y: 380, w: 200, h: 30, moving: true, dy: -4, yRange: [140, 380], bidir: true },

            // Vertical laser sweeps
            { x: 600, y: 150, w: 35, h: 200, moving: true, dx: 3.5, xRange: [560, 740], bidir: true },
            { x: 740, y: 250, w: 35, h: 200, moving: true, dx: -3.5, xRange: [560, 740], bidir: true },

            // Diagonal cutters
            { x: 850, y: 180, w: 75, h: 75, moving: true, dx: 3.5, dy: 3.5, xRange: [820, 980], yRange: [160, 360], bidir: true },
            { x: 980, y: 360, w: 75, h: 75, moving: true, dx: -3.5, dy: -3.5, xRange: [820, 980], yRange: [160, 360], bidir: true },
        ]
    },
    {
        level: 24,
        name: "Plasma Corridor",
        carStart: { x: 130, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 160, y: HEIGHT / 2 },
        playSpeed: 155,
        bgColor: "#00131a",
        gridColor: "rgba(0,255,255,0.18)",
        pathColor: "#00f5ff",
        carColor: "#00c2cc",
        petrolPump: [
            { x: 720, y: 350, r: 30 }
        ],
        obstacles: [
            { x: 320, y: 120, w: 220, h: 26, moving: true, dy: 3.5, yRange: [120, 360], bidir: true },
            { x: 320, y: 400, w: 220, h: 26, moving: true, dy: -3.5, yRange: [120, 360], bidir: true },

            { x: 600, y: 150, w: 32, h: 220, moving: true, dx: 3, xRange: [560, 740], bidir: true },
            { x: 760, y: 250, w: 32, h: 220, moving: true, dx: -3, xRange: [560, 740], bidir: true },

            { x: 900, y: 200, w: 70, h: 70, moving: true, dx: 3, dy: 3, xRange: [860, 980], yRange: [160, 360], bidir: true },
        ]
    },
    {
        level: 25,
        name: "Electric Maze",
        carStart: { x: 130, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 160, y: HEIGHT / 2 },
        playSpeed: 160,
        bgColor: "#0a1628",
        gridColor: "rgba(56,189,248,0.25)",
        pathColor: "#38bdf8",
        carColor: "#0284c7",
        petrolPump: [
            { x: 480, y: 200, r: 28 },
            { x: 720, y: 380, r: 28 }
        ],
        obstacles: [
            // Electric barriers - complex maze
            { x: 300, y: 140, w: 180, h: 35, moving: true, dx: 3.5, xRange: [280, 450], bidir: true },
            { x: 300, y: 380, w: 180, h: 35, moving: true, dx: -3.5, xRange: [280, 450], bidir: true },

            { x: 550, y: 120, w: 40, h: 180, moving: true, dy: 4, yRange: [120, 320], bidir: true },
            { x: 650, y: 300, w: 40, h: 180, moving: true, dy: -4, yRange: [180, 380], bidir: true },

            { x: 800, y: 180, w: 85, h: 85, moving: true, dx: 4, dy: 3.5, xRange: [750, 920], yRange: [160, 360], bidir: true },
            { x: 920, y: 340, w: 85, h: 85, moving: true, dx: -4, dy: -3.5, xRange: [750, 920], yRange: [160, 360], bidir: true },
        ]
    },
    {
        level: 26,
        name: "The Blade Runner",
        carStart: { x: 130, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 160, y: HEIGHT / 2 },
        playSpeed: 132,
        bgColor: "#1a0033",
        gridColor: "rgba(168,85,247,0.25)",
        pathColor: "#a855f7",
        carColor: "#7e22ce",
        petrolPump: [
            { x: 650, y: HEIGHT / 2, r: 30 }
        ],
        obstacles: [
            // Razor-thin vertical blades
            { x: 320, y: 100, w: 25, h: 400, moving: true, dy: 5.5, yRange: [100, 200], bidir: true },
            { x: 450, y: 200, w: 25, h: 400, moving: true, dy: -5.5, yRange: [100, 200], bidir: true },
            { x: 580, y: 100, w: 25, h: 400, moving: true, dy: 6, yRange: [100, 200], bidir: true },
            { x: 710, y: 200, w: 25, h: 400, moving: true, dy: -6, yRange: [100, 200], bidir: true },
            { x: 840, y: 100, w: 25, h: 400, moving: true, dy: 5.5, yRange: [100, 200], bidir: true },
            { x: 970, y: 200, w: 25, h: 400, moving: true, dy: -5.5, yRange: [100, 200], bidir: true },
        ]
    },
    {
        level: 27,
        name: "Gravity Trap",
        carStart: { x: 120, y: HEIGHT - 150 },
        finishPos: { x: WIDTH - 140, y: 120 },
        playSpeed: 130,
        bgColor: "#1e1b4b",
        gridColor: "rgba(99,102,241,0.25)",
        pathColor: "#6366f1",
        carColor: "#4f46e5",
        petrolPump: [{ x: WIDTH / 2, y: HEIGHT / 2, r: 26 }],
        obstacles: [
            { x: 350, y: 120, w: 35, h: 380, zigzag: true },
            { x: 520, y: 180, w: 35, h: 350, moving: true, dy: 5 },
            { x: 700, y: 100, w: 70, h: 70, rotating: true, angleSpeed: 0.12 },
            { x: 860, y: 200, w: 35, h: 300 }
        ]
    },
    {
        level: 28,
        name: "Shifting Gap Ritual",
        carStart: { x: 120, y: HEIGHT / 2 },
        finishPos: { x: WIDTH - 150, y: HEIGHT / 2 },
        playSpeed: 148,

        bgColor: "#020617",
        gridColor: "rgba(14,165,233,0.2)",
        pathColor: "#0ea5e9",
        carColor: "#0369a1",

        petrolPump: [
            // { x: WIDTH / 2, y: HEIGHT / 2 + 140, r: 28 }
            { x: WIDTH / 2, y: HEIGHT / 5 + 190, r: 28 }
        ],

        obstacles: [
            // WALL SET 1 (TOP + BOTTOM GAP MOVES)
            { x: 260, y: 0, w: 40, h: 220, moving: true, dy: 4, yRange: [0, 120] },
            { x: 260, y: 360, w: 40, h: 240, moving: true, dy: -4, yRange: [300, 420] },

            // WALL SET 2 (FASTER + OFFSET)
            { x: 360, y: 0, w: 40, h: 240, moving: true, dy: 6, yRange: [0, 140] },
            { x: 360, y: 380, w: 40, h: 220, moving: true, dy: -6, yRange: [320, 440] },

            // FUEL BAIT ZONE (SAFE LOOK, EXIT HARD)
            { x: 520, y: 140, w: 40, h: 260 },
            { x: 620, y: 0, w: 40, h: 240, moving: true, dy: 7 },
            { x: 620, y: 360, w: 40, h: 240, moving: true, dy: -7 },

            // FINAL PANIC GAP (VERY FAST)
            { x: 760, y: 0, w: 34, h: 260, moving: true, dy: 9 },
            { x: 760, y: 340, w: 34, h: 260, moving: true, dy: -9 },

            { x: 860, y: 120, w: 30, h: 360, moving: true, dy: 10 }
        ]
    }



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


// 19-12//
function drawFuelBar(ctx, car) {

    const barX = 20;
    const barY = 20;
    const barW = 200;
    const barH = 18;

    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barW, barH);

    const fuelWidth = (car.fuel / car.maxFuel) * barW;
    ctx.fillStyle = fuelWidth > 50 ? "#22c55e" : "#ef4444";
    ctx.fillRect(barX, barY, fuelWidth, barH);

    ctx.strokeStyle = "#000";
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText("Fuel", barX, barY - 5);
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


    const [mode, setMode] = useState('draw');
    const [score, setScore] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);
    const [showNextLevel, setShowNextLevel] = useState(false);
    const [showLevelComplete, setShowLevelComplete] = useState(false); // 26-12 --banner//

    const [gameStarted, setGameStarted] = useState(false);

    const [totalStars, setTotalStars] = useState(0);

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
                w: 46,
                h: 30,
                angle: 0,
                finished: false,
                falling: false,


                vy: 0,            // vertical velocity (important)
                // gravity: 0.2,  
                visible: true,
                //19-12 //
                fuel: 100,
                maxFuel: 100,
                //fuelDrainRate: 0.03,
                fuelDrainRate: 0.1,
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

        // setScore(0);
        setShowNextLevel(false);
        setGameStarted(false);
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
        roundRect(ctx, -23, -12, 46, 24, 6, true, false);
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


    // Helper: obstacles એ currentConfig.obstacles છે કે જે તમે drawObstacles પાસ કરી રહ્યા છોઅ
    function getTopObstacleUnderCar(car, obstacles) {
        const carBottom = car.y + car.h;
        // આ variable નજીકનું obstacle store કરશે.
        let candidate = null;

        for (const o of obstacles) {
            // જો કાર સંપૂર્ણપણે left, right side છે → overlap નથી → skip
            const overlapX = !(car.x + car.w <= o.x || car.x >= o.x + o.w);

            if (!overlapX) continue;

            if (o.y >= carBottom) {
                // પહેલા મળેલું obstacle store થાય
                if (!candidate || o.y < candidate.y) {
                    candidate = o;
                }
            }
        }
        return candidate;
    }


    // ----------------- START PLAY (updated) -----------------
    const startPlay = useCallback(() => {
        const s = stateRef.current;
        const config = LEVEL_CONFIGS[currentLevel - 1];


        // stateRef.current.config = config;

        // 🔑 THIS IS THE KEY LINE
        // s.config = config;
        //      stateRef.current.config = config; // 19-12//

        // --- reset physics / states ---
        s.playSpeed = typeof config.playSpeed === 'number' ? config.playSpeed : (s.playSpeed || 120);
        if (s.car === undefined) s.car = { x: config.carStart.x, y: config.carStart.y, w: 46, h: 30, angle: 0 };
        if (s.car.vy === undefined) s.car.vy = 0;
        else s.car.vy = 0;
        if (s.car.gravity === undefined) s.car.gravity = 0.2;
        s.car.falling = false;
        s.car.finished = false;

        // safety: ensure path is an array
        if (!Array.isArray(s.path)) s.path = [];

        // if path too short → just fall
        if (s.path.length < 1) {
            console.log('startPlay: path too short -> falling', { pathLen: s.path.length });
            s.playing = false;
            s.playProgress = 0;
            s.car.falling = true;
            s.car.vy = 0;
            // ensure loop running so falling resolves if needed
            if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
            setMode('play');
            setGameStarted(true);
            return;
        }

        // --- decide where to attach the car to the path ---
        const firstPoint = s.path[0];
        const dx = firstPoint.x - s.car.x;
        const dy = firstPoint.y - s.car.y;
        const distToStart = Math.hypot(dx, dy);
        const SNAP_THRESHOLD = 8;

        if (distToStart <= SNAP_THRESHOLD) {
            // ensure path begins from car so followPath has a sensible starting segment
            if (Math.hypot(s.car.x - firstPoint.x, s.car.y - firstPoint.y) > 1) {
                s.path.unshift({ x: s.car.x, y: s.car.y });
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
            // try to find nearest downward point within tolerances
            const HORIZ_TOL = 60;
            const VERT_TOL = 400;
            let cum = [0];
            for (let i = 1; i < s.path.length; i++) {
                const a = s.path[i - 1], b = s.path[i];
                cum[i] = cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y);
            }

            let bestIdx = -1;
            let bestDy = Infinity;
            for (let i = 0; i < s.path.length; i++) {
                const p = s.path[i];
                const dxp = Math.abs(p.x - s.car.x);
                const dyp = p.y - s.car.y;
                if (dxp <= HORIZ_TOL && dyp > 0 && dyp <= VERT_TOL) {
                    if (dyp < bestDy) {
                        bestDy = dyp;
                        bestIdx = i;
                    }
                }
            }

            if (bestIdx !== -1) {
                s.playProgress = cum[bestIdx] || 0;

                const CAR_OFFSET = -22;
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
                console.log('startPlay: no attach point -> falling', { pathLen: s.path.length });
                s.playing = false;
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

    function followPath(progress, path, groundY = Infinity) {
        if (!Array.isArray(path) || !path.length < 0) return null;

        // ---- tunables ----
        const JOIN_EPS = 2;
        const SNAP_DIST = 6;
        const MAX_VERTICAL_SNAP = 3;
        const TIME_SCALE = 70;
        const HORIZ_SPEED = 140;
        const LAUNCH_VY = 0;
        const GRAVITY = 120;
        const MIN_FALL_GAP = 20;

        const SIM_DT = 1 / 120;
        const MAX_SIM_TIME = 5;
        const LANDING_EPS = 16;
        const APPROACH_ALLOWANCE = 0.5;

        const carOffset = 0; // car drawing offset (use same as loop)

        // ---- find first stroke length (stop at break) ----
        let firstStrokeLength = 1;
        let breakIndex = -1; // index i where path[i+1].break === true
        for (let i = 0; i < path.length - 2; i++) {
            const a = path[i], b = path[i + 1];
            if (b && b.break) { breakIndex = i; break; }
            firstStrokeLength += Math.hypot(b.x - a.x, b.y - a.y);
        }

        // 1) still on first stroke -> exact interpolation
        if (progress <= firstStrokeLength) {
            let p = progress;
            for (let i = 0; i < path.length - 1; i++) {
                const a = path[i], b = path[i + 1];
                if (b && b.break) break;
                const L = Math.hypot(b.x - a.x, b.y - a.y);
                if (p <= L) {
                    const t = L === 0 ? 0 : p / L;
                    const x = a.x + (b.x - a.x) * t;
                    const y = a.y + (b.y - a.y) * t;
                    const angle = Math.atan2(b.y - a.y, b.x - a.x);
                    return { x: x + (-Math.sin(angle) * carOffset), y: y + (Math.cos(angle) * carOffset), angle, falling: false, finished: false, visible: true, progress };
                }
                p -= L;
            }
        }

        // After first stroke -> fall/jump logic
        const fallProgress = progress - firstStrokeLength;

        // last point on first stroke and prev for direction
        let lastOnStroke = null;
        let prevToLast = null;
        if (breakIndex >= 0) {
            lastOnStroke = path[breakIndex];
            prevToLast = path[breakIndex - 1] || null;
        } else {
            lastOnStroke = path[path.length - 1];
            prevToLast = path[path.length - 2] || null;
        }

        // build strokes array (split by break)
        const strokes = [];
        let current = [];
        for (let p of path) {
            if (p.break) {
                if (current.length > 1) strokes.push([...current]);
                current = [];
            } else {
                current.push(p);
            }
        }
        if (current.length > 1) strokes.push([...current]);
        if (strokes.length === 0) return null;

        // compute stroke lengths
        // const strokeLengths = strokes.map(st => {
        //     let L = 0;
        //     for (let i = 1; i < st.length; i++) L += Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y);
        //     return L;
        // });

        // next stroke start index in original path (point after breakIndex)
        const nextIndex = (breakIndex >= 0) ? breakIndex + 1 : -1;
        const nextPt = (nextIndex >= 0 && nextIndex < path.length) ? path[nextIndex] : null;

        // gap distance between strokes (straight-line)
        let distOffset = 0;
        if (nextPt && lastOnStroke) distOffset = Math.hypot(nextPt.x - lastOnStroke.x, nextPt.y - lastOnStroke.y);

        // progress along next stroke (distance) - clamp >= 0
        let nextStrokeProgress = Math.max(0, fallProgress - distOffset);

        // helper to compute distance along a stroke (using strokeStart = index in path where that stroke begins)
        function distanceOnStroke_fromPath(path, strokeStartPathIndex, segIndexPath, x, y) {
            // sum segment lengths from strokeStartPathIndex ... segIndexPath-1
            let dist = 0;
            for (let idx = strokeStartPathIndex; idx < segIndexPath; idx++) {
                const a = path[idx], b = path[idx + 1];
                if (!a || !b) break;
                if (b && b.break) break;
                dist += Math.hypot(b.x - a.x, b.y - a.y);
            }
            // add partial inside segIndexPath
            const a = path[segIndexPath], b = path[segIndexPath + 1];
            if (!a || !b) return dist;
            const segLen = Math.hypot(b.x - a.x, b.y - a.y) || 1;
            const partial = Math.hypot(x - a.x, y - a.y);
            dist += Math.max(0, Math.min(partial, segLen));
            return dist;
        }

        // 2A) tiny join -> direct continuation (immediate next point tiny distance)
        if (nextPt) {
            const dxn = nextPt.x - lastOnStroke.x;
            const dyn = nextPt.y - lastOnStroke.y;
            const distToNext = Math.hypot(dxn, dyn);

            // If gap is clearly bigger than our forced fall threshold, do NOT snap
            if (distToNext > MIN_FALL_GAP) {
                // force physics — do not try to snap or continue: let simulation/fall logic run
            } else {
                // immediate perfect join (touching endpoints)
                if (distToNext <= JOIN_EPS) {
                    let p = nextStrokeProgress;
                    for (let i = nextIndex; i < path.length - 1; i++) {
                        const a = path[i], b = path[i + 1];
                        if (b && b.break) break;
                        const L = Math.hypot(b.x - a.x, b.y - a.y);
                        if (p <= L) {
                            const t = L === 0 ? 0 : p / L;
                            const x = a.x + (b.x - a.x) * t;
                            const y = a.y + (b.y - a.y) * t;
                            const angle = Math.atan2(b.y - a.y, b.x - a.x);
                            const totalProgress = firstStrokeLength + distToNext + p;
                            return { x: x + (-Math.sin(angle) * carOffset), y: y + (Math.cos(angle) * carOffset), angle, falling: false, finished: false, visible: true, progress: totalProgress };
                        }
                        p -= L;
                    }
                    const last = path[path.length - 1];
                    return { x: last.x, y: last.y, angle: 0, falling: false, finished: true, visible: true, progress: firstStrokeLength + distOffset };
                }

                // forgiving snap only if within small SNAP_DIST and small vertical difference
                if (distToNext <= SNAP_DIST && Math.abs(dyn) <= MAX_VERTICAL_SNAP) {
                    // compute approach direction from previous segment
                    let dirX = 1, dirY = 0;
                    if (prevToLast) {
                        const dx = lastOnStroke.x - prevToLast.x;
                        const dy = lastOnStroke.y - prevToLast.y;
                        const norm = Math.hypot(dx, dy) || 1;
                        dirX = dx / norm;
                        dirY = dy / norm;
                    }
                    const toNextX = dxn / (distToNext || 1);
                    const toNextY = dyn / (distToNext || 1);
                    const approachDot = (dirX * toNextX + dirY * toNextY);

                    // require reasonable forward approach; else do not snap
                    if (approachDot >= 0.7) {
                        let p = nextStrokeProgress;
                        for (let i = nextIndex; i < path.length - 1; i++) {
                            const a = path[i], b = path[i + 1];
                            if (b && b.break) break;
                            const L = Math.hypot(b.x - a.x, b.y - a.y);
                            if (p <= L) {
                                const t = L === 0 ? 0 : p / L;
                                const x = a.x + (b.x - a.x) * t;
                                const y = a.y + (b.y - a.y) * t;
                                const angle = Math.atan2(b.y - a.y, b.x - a.x);
                                const landedDist = distanceOnStroke_fromPath(path, nextIndex, i, x, y);
                                const totalProgress = firstStrokeLength + distOffset + landedDist;
                                return { x: x + (-Math.sin(angle) * carOffset), y: y + (Math.cos(angle) * carOffset), angle, falling: false, finished: false, visible: true, progress: totalProgress };
                            }
                            p -= L;
                        }
                        const last = path[path.length - 1];
                        const landedDist = distanceOnStroke_fromPath(path, nextIndex, path.length - 2, last.x, last.y);
                        return { x: last.x, y: last.y, angle: 0, falling: false, finished: true, visible: true, progress: firstStrokeLength + distOffset + landedDist };
                    }
                    // else: do not snap -> let physics handle falling
                }
                // if none of the above conditions matched, we let the physics code run (fall)
            }
        }


        // 2C) physics jump/fall from lastOnStroke
        let dirX = 1, DirY = 0;
        if (prevToLast) {
            const dx = lastOnStroke.x - prevToLast.x;
            const dy = lastOnStroke.y - prevToLast.y;
            const norm = Math.hypot(dx, dy) || 1;
            dirX = dx / norm;
            DirY = dy / norm;
        }

        const vx = dirX * HORIZ_SPEED;
        const vy0 = -LAUNCH_VY;

        const elapsedSec = Math.max(0, fallProgress / TIME_SCALE);
        const simMaxT = Math.min(MAX_SIM_TIME, elapsedSec + SIM_DT);

        if (nextIndex >= 0) {
            let bestCollision = null;
            const maxSteps = Math.ceil(simMaxT / SIM_DT);
            for (let step = 0; step <= maxSteps; step++) {
                const t = step * SIM_DT;
                if (t > simMaxT) break;
                const x_t = lastOnStroke.x + vx * t;
                const y_t = lastOnStroke.y + vy0 * t + 0.5 * GRAVITY * t * t;

                if (y_t >= groundY) break;

                for (let i = nextIndex; i < path.length - 1; i++) {
                    const a = path[i], b = path[i + 1];
                    if (!a || !b) continue;

                    const sx = b.x - a.x;
                    const sy = b.y - a.y;
                    const segLen2 = sx * sx + sy * sy || 1;
                    const vxToP_x = x_t - a.x;
                    const vxToP_y = y_t - a.y;
                    const proj = (vxToP_x * sx + vxToP_y * sy) / segLen2;

                    if (proj < 0 || proj > 1) {
                        // outside this segment
                    } else {
                        const cx = a.x + proj * sx;
                        const cy = a.y + proj * sy;
                        const dist = Math.hypot(x_t - cx, y_t - cy);

                        if (dist <= LANDING_EPS && y_t <= cy + Math.max(APPROACH_ALLOWANCE, LANDING_EPS)) {
                            const angle = Math.atan2(sy, sx);
                            if (!bestCollision || t < bestCollision.t) {
                                bestCollision = { t, segIndex: i, sx: cx, sy: cy, angle };
                            }
                        }
                    }

                    if (b && b.break) {
                        // don't check segments after this break
                        break;
                    }
                }

                if (bestCollision && bestCollision.t <= t) break;
            }

            if (bestCollision && bestCollision.t <= simMaxT) {
                // compute distance along next stroke where we landed
                const landedDist = distanceOnStroke_fromPath(path, nextIndex, bestCollision.segIndex, bestCollision.sx, bestCollision.sy);
                const totalProgress = firstStrokeLength + distOffset + landedDist;

                return {
                    x: bestCollision.sx + (-Math.sin(bestCollision.angle) * carOffset),
                    y: bestCollision.sy + (Math.cos(bestCollision.angle) * carOffset),
                    angle: bestCollision.angle,
                    falling: false,
                    finished: false,
                    visible: true,
                    progress: totalProgress
                };
            }
        }

        // ===== IMPORTANT: if no landing collision was found, we MUST return a falling/free-fall state
        // so the main loop can detect transition into falling and apply the throw impulse once.
        // Compute free-fall position at elapsedSec and return falling:true
        {
            const t = elapsedSec;
            const x_free = lastOnStroke.x + vx * t;
            const y_free = lastOnStroke.y + vy0 * t + 0.5 * GRAVITY * t * t;
            const vy = vy0 + GRAVITY * t;
            const angle = Math.atan2(vy, vx);

            // if hit ground
            if (y_free >= groundY) {
                return { x: lastOnStroke.x + (-Math.sin(Math.PI / 2) * carOffset), y: groundY, angle: Math.PI / 2, falling: false, finished: true, visible: false, progress: firstStrokeLength + distOffset };
            }

            // return falling state (very important)
            return {
                x: x_free + (-Math.sin(angle) * carOffset),
                y: y_free + (Math.cos(angle) * carOffset),
                angle,
                falling: true,
                finished: false,
                visible: true,
                vx, vy,
                progress: firstStrokeLength + Math.max(0, fallProgress)
            };

        }
    }

    // place this helper near top-level (above loop) so loop can call it
    function findLastOnStroke(path) {
        if (!Array.isArray(path) || path.length === 0) return null;
        for (let i = 0; i < path.length - 1; i++) {
            const a = path[i], b = path[i + 1];
            if (b && b.break) return a;
        }
        return path[path.length - 1];
    }

    function aabb(a, b) {
        return !(
            a.x + a.w < b.x ||
            a.x > b.x + b.w ||
            a.y + a.h < b.y ||
            a.y > b.y + b.h
        );
    }

    // Replace your updateCar with this version (call from loop as updateCar(s, dt, HEIGHT - 20))
    function updateCar(s, dt, groundY = Infinity) {


        // 🎉 FINISH CONFETTI UPDATE (ALWAYS RUNS) // 24-12 -- animation//
        if (finishAnimActive) {
            finishTimer += dt;

            // move particles
            finishConfetti = finishConfetti.filter(p => p.life > 0);
            finishConfetti.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                p.vy += 0.15;
                p.vx *= 0.99;
                p.life--;
            });

            // 26-12 --winner//
            // 🏆 WINNER TEXT animation
            if (winnerScale < 1) winnerScale += 0.035;
            if (winnerGlow < 35) winnerGlow += 1.2;

            // 🌑 DARK PHASE after first animation
            if (finishTimer > 1.6) finishPhase = 1;

            if (finishPhase === 1 && finishOverlayAlpha < 0.55) {
                finishOverlayAlpha += 0.01;
                winnerAlpha -= 0.003;
            }

            // 🛑 END animation
            if (finishTimer > 3) {
                finishAnimActive = false;
                showNextBanner = true;
                finishConfetti = [];
                finishOverlayAlpha = 0;
                winnerScale = 0;
                winnerAlpha = 1;
                winnerGlow = 0;
                winnerPulse = 0;

            } // wineer//



            // 🔥 after 1.2 sec → DARK PHASE
            if (finishTimer > 1.2) {
                finishPhase = 1;
            }

            // dark fade in slowly
            if (finishPhase === 1 && finishOverlayAlpha < 0.45) {
                finishOverlayAlpha += 0.008;
            }

            // 🔁 CONTINUOUS SOFT BURSTS (EVERY ~2s)
            if (finishHold && Math.floor(finishTimer * 10) % 18 === 0) {
                spawnFinishBlast(WIDTH, HEIGHT);
            }


            // end animation after ~5 sec
            if (finishTimer > 5) {
                finishAnimActive = false;
                finishConfetti = [];
                finishOverlayAlpha = 0;
            }

        }

        if (!s.playing || s.car.finished) return;

        // --------------------------------------------
        // 1) If already in falling mode -> integrate physics (dt)
        // --------------------------------------------
        //if (s.car.falling)
        if (s.car.falling && !s.car.finished) { // 23-12//
            const AIR_GRAVITY = (typeof s.car.gravity === 'number') ? s.car.gravity : 1200; // px/s^2
            // integrate velocities with dt (framerate independent)
            s.car.vy += AIR_GRAVITY * dt;
            s.car.x += (s.car.vx || 0) * dt;
            s.car.y += (s.car.vy || 0) * dt;

            // orientation: point toward velocity vector
            s.car.angle = Math.atan2(s.car.vy || 0, s.car.vx || 0);

            // optional: clamp to ground here if you like
            if (s.car.y >= groundY) {
                s.car.y = groundY;
                s.car.vy = 0;
                s.car.vx = 0;
                s.car.falling = false;
                s.car.finished = true;
            }
            return;
        }

        // --------------------------------------------
        // 2) Sample followPath (use groundY) to know on-path vs predicted fall
        // --------------------------------------------
        // currPos = current progress, nextPos = sample slightly ahead for slope/gap test
        const currPos = followPath(s.playProgress, s.path, groundY);
        const nextPos = followPath(s.playProgress + 1, s.path, groundY);

        // if followPath can't produce either, go to falling
        if (!currPos || !nextPos) {
            // Let the main loop / or this function start falling state.
            // Do not zero velocities here; keep any existing vx/vy or init them.
            s.car.falling = true;
            s.car.vx = (typeof s.car.vx === 'number') ? s.car.vx : 0;
            s.car.vy = (typeof s.car.vy === 'number') ? s.car.vy : 0;
            return;
        }

        // --------------------------------------------
        // 3) Basic slope speed logic (unchanged)
        // --------------------------------------------
        const dy = nextPos.y - currPos.y;
        const gravity = 0; // you can tune this if you want slope to affect playSpeed

        if (dy < 0) {
            s.playSpeed -= gravity;
            if (s.playSpeed < 0) s.playSpeed = -50;
        } else if (dy > 0) {
            if (s.playSpeed < 0) s.playSpeed = 0;
            s.playSpeed += gravity;
            if (s.playSpeed > 100) s.playSpeed = 120;
        }

        // --------------------------------------------
        // 4) Advance progress (only here or only in loop, not both)
        // --------------------------------------------
        // s.playProgress += s.playSpeed * dt;

        // get fresh pos after progress advance (with groundY)
        const pos = followPath(s.playProgress, s.path, groundY);

        // if followPath returns null -> start falling
        if (!pos) {
            s.car.falling = true;
            s.car.vx = (typeof s.car.vx === 'number') ? s.car.vx : 0;
            s.car.vy = (typeof s.car.vy === 'number') ? s.car.vy : 0;
            return;
        }

        // --------------------------------------------
        // 5) If followPath predicts falling -> adopt predicted velocities and mark falling
        // --------------------------------------------
        if (pos.falling) {
            // adopt followPath's predicted free-fall state (do NOT zero vx/vy)
            s.car.x = pos.x;
            s.car.y = pos.y;
            if (typeof pos.angle === 'number') s.car.angle = pos.angle;
            if (typeof pos.vx === 'number') s.car.vx = pos.vx;
            if (typeof pos.vy === 'number') s.car.vy = pos.vy;

            s.car.falling = true;
            s.car.finished = false;
            // leave visibility as followPath suggests
            s.car.visible = (typeof pos.visible === 'boolean') ? pos.visible : true;

            return; // let next frame integrate falling physics above
        }

        // --------------------------------------------
        // 6) On-path placement: place car and reset air velocities
        // --------------------------------------------
        const CAR_OFFSET = -22;
        s.car.x = pos.x - Math.sin(pos.angle) * CAR_OFFSET;
        s.car.y = pos.y + Math.cos(pos.angle) * CAR_OFFSET;
        s.car.angle = pos.angle;

        // On the path -> zero airborne velocities (we are grounded on stroke)
        s.car.falling = false;
        s.car.vx = 0;
        s.car.vy = 0;
        s.car.finished = !!pos.finished;
        s.car.visible = (typeof pos.visible === 'boolean') ? pos.visible : true;

        // if followPath says finished at ground, also stop playing
        if (pos.finished) {
            s.playing = false;
            s.playSpeed = 0;
            s.car.finished = true;
        }
    }


    function loop(ts) {
        const s = stateRef.current;


        // Time delta
        if (!s.lastTime) s.lastTime = ts;
        const dt = (ts - s.lastTime) / 1000;
        s.lastTime = ts;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // constants
        updateCar(s, dt);

        // 23-12//
        drawCar(ctx, s.car.x, s.car.y, s.car.angle);


        // 22-12-2015// ==//23-12//
        const FINISH_RADIUS = 25;
        const FINISH_EXIT_DISTANCE = 80; // 🔥 line બહાર કેટલું જવું

        if (!s.car.finished) {
            const dx = s.car.x - s.finish.x;
            const dy = s.car.y - s.finish.y;

            if (Math.hypot(dx, dy) <= FINISH_RADIUS) {

                // ✅ Mark finish
                s.car.finished = true;
                s.playing = false;

                // ➡️ Move car forward in its current direction
                const angle = s.car.angle || 0;

                s.car.x = s.finish.x + Math.cos(angle) * FINISH_EXIT_DISTANCE;
                s.car.y = s.finish.y + Math.sin(angle) * FINISH_EXIT_DISTANCE;

                // 🛑 Stop all movement
                s.car.vy = 0;
                s.car.vy = 0;
                s.car.falling = false;


                // 👁️ Always visible
                s.car.visible = true;
                setShowNextLevel(true);
            }
        }

        // 19-12//
        if (Array.isArray(currentConfig.petrolPump)) {

            currentConfig.petrolPump.forEach(pump => {
                if (!pump.used && checkPetrolPumpCollision(s.car, pump)) {
                    pump.used = true;
                    s.car.fuel = s.car.maxFuel;
                }
            });
        }


        // 20-12//
        // ⛽ DRAW PETROL PUMP (ADD HERE)
        if (Array.isArray(currentConfig.petrolPump)) {
            currentConfig.petrolPump.forEach(pump => {
                if (!pump.used) {
                    drawPetrolPump(ctx, pump);
                }
            });
        }



        // 19-12//
        const pump = currentConfig.petrolPump;

        if (pump && !pump.used) {
            if (checkPetrolPumpCollision(s.car, pump)) {
                pump.used = true;
                s.car.fuel = s.car.maxFuel; // FULL REFILL
            }
        }




        const obstacles = currentConfig?.obstacles ?? [];
        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;
        const GRAVITY = 1200;

        // defaults
        if (s.car.vy === undefined) s.car.vy = 0;
        if (s.playSpeed === undefined) s.playSpeed = 120;
        if (!Array.isArray(s.path)) s.path = [];

        // ---------- loop: only replaced/added parts (integrate into your loop function) ----------

        // --- path-following & play progress ---
        if (s.playing && !s.car.finished && !s.gameOver) {
            s.playProgress += s.playSpeed * dt;
            // 19-12//
            // ⛽ FUEL DRAIN (LEVEL 21+)
            // ⛽ Fuel Drain
            if (s.playing && s.petrolPump && !s.car.finished) {
                s.car.fuel -= s.car.fuelDrainRate * dt * 60;

                if (s.car.fuel <= 0) {
                    s.car.fuel = 0;
                    s.playing = false;
                    s.car.falling = true; // fuel khatam = game over
                }
            }
            // pass canvas ground (adjust -20 if you want the ground a little higher)
            let pos = null;
            try {
                pos = typeof followPath === 'function' ? followPath(s.playProgress, s.path, HEIGHT - 20) : null;
            } catch (e) {
                console.log(e.message);
                pos = null;
            }

            // 19 -12 //
            // 🚗 update car position
            if (pos) {
                s.car.x = pos.x;
                s.car.y = pos.y;
                s.car.angle = pos.angle;
                s.car.falling = pos.falling;

                //20-12//
                // ⭐ falling ONLY when fuel is empty
                // if (s.car.fuel <= 0) {
                //     s.car.falling = true;
                // }
                s.car.finished = pos.finished;
            }
            // 19-12//
            // // ⛽ ✅ PETROL PUMP COLLISION — EXACT HERE
            const config = s.config;
            if (config && config.petrolPump) {
                const pumps = Array.isArray(config.petrolPump)
                    ? config.petrolPump
                    : [config.petrolPump];

                for (let i = 0; i < pumps.length; i++) {
                    const pump = pumps[i];
                    if (
                        pump &&
                        !pump.used &&
                        checkPetrolPumpCollision(s.car, pump)
                    ) {
                        pump.used = true;
                        s.car.fuel = s.car.maxFuel; // 🔥 refill
                    }
                }
            }



            // ⛽ FUEL DRAIN — ⭐ YAHI ADD KARO ⭐
            if (s.playing && !s.car.finished && !s.car.falling) {
                s.car.fuel -= s.car.fuelDrainRate * dt * 60; // smooth drain

                if (s.car.fuel <= 0) {
                    s.car.fuel = 0;
                    s.playing = false;
                    s.car.falling = true; // fuel khatam = car band
                }
            }

            //20-12 //
            // if (s.playing && !s.car.finished && !s.car.falling) {
            //     s.car.fuel -= s.car.fuelDrainRate;

            //     if (s.car.fuel < 0) s.car.fuel = 0;

            //     if (s.car.fuel === 0) {
            //         s.playing = false;
            //         s.car.falling = true;
            //     }
            // }

            // fallback: walk along polyline by distance (unchanged)
            if (!pos && s.path.length >= 0) {
                let remaining = s.playProgress;
                for (let i = 1; i < s.path.length; i++) {
                    const a = s.path[i - 1], b = s.path[i];
                    const seg = Math.hypot(b.x - a.x, b.y - a.y);
                    if (remaining <= seg) {
                        const t = seg === 0 ? 0 : (remaining / seg);
                        const x = a.x + (b.x - a.x) * t;
                        const y = a.y + (b.y - a.y) * t;
                        const angle = Math.atan2(b.y - a.y, b.x - a.x);
                        pos = { x, y, angle, falling: false, finished: false, visible: true };
                        break;
                    }
                    remaining -= seg;
                }
                if (!pos) pos = null;
            }

            // --- handle transition to falling with a "throw" impulse ---
            if (s.car.vx === undefined) s.car.vx = 0;

            // remember previous falling state
            const wasFalling = !!s.car.falling;

            if (pos) {
                if (pos.falling) {
                    // adopt predicted free-fall (do not zero vx/vy)
                    s.car.x = pos.x;
                    s.car.y = pos.y;
                    if (typeof pos.angle === 'number') s.car.angle = pos.angle;
                    if (typeof pos.vx === 'number') s.car.vx = pos.vx;
                    if (typeof pos.vy === 'number') s.car.vy = pos.vy;
                    s.car.falling = true;
                    s.car.finished = false;
                    s.car.visible = (typeof pos.visible === 'boolean') ? pos.visible : true;
                    if (pos.progress !== undefined) s.playProgress = pos.progress;
                } else {
                    // on-path -> place exactly and zero airborne velocities
                    if (pos.progress !== undefined) s.playProgress = pos.progress;
                    const CAR_OFFSET = -22;
                    s.car.x = pos.x + (-Math.sin(pos.angle) * CAR_OFFSET);
                    s.car.y = pos.y + (Math.cos(pos.angle) * CAR_OFFSET);
                    s.car.angle = pos.angle;
                    s.car.falling = false;
                    s.car.vy = 0;
                    s.car.vx = 0;
                    s.car.finished = !!pos.finished;
                    s.car.visible = (typeof pos.visible === 'boolean') ? pos.visible : true;
                    if (pos.finished) {
                        s.playing = false;
                        s.playSpeed = 0;
                        s.car.finished = true;
                        s.car.falling = false;
                        s.car.visible = false;
                    }
                }
            } else {
                // no pos -> enter falling state (keep existing vx/vy if any)
                s.car.falling = true;
                s.car.vx = (typeof s.car.vx === 'number') ? s.car.vx : 0;
                s.car.vy = (typeof s.car.vy === 'number') ? s.car.vy : 0;
                s.car.visible = true;
            }

            //19-12//
            // ⛽ PETROL PUMP TOUCH CHECK (Level 21+)
            if (s.petrolPump && !s.petrolPump.used && s.car.visible) {

                const pumpRect = {
                    x: s.petrolPump.x - s.petrolPump.w / 2,
                    y: s.petrolPump.y - s.petrolPump.h / 2,
                    w: s.petrolPump.w,
                    h: s.petrolPump.h
                };

                const carRect = {
                    x: s.car.x - s.car.w / 2,
                    y: s.car.y - s.car.h / 2,
                    w: s.car.w,
                    h: s.car.h
                };

                if (aabb(carRect, pumpRect)) {
                    s.car.fuel = s.car.maxFuel;   // 🟢 GREEN LINE FULL
                    s.petrolPump.used = true;
                }
            }

            // If we just transitioned from on-path -> falling, give a throw impulse.
            if (!wasFalling && s.car.falling && !s.car.finished) {
                let segAngle = Math.PI / 2; // default vertical
                if ((s.path || []).length >= 2) {
                    const lastIndex = s.path.length - 1;
                    const a = s.path[Math.max(0, lastIndex - 1)];
                    const b = s.path[lastIndex];
                    segAngle = Math.atan2(b.y - a.y, b.x - a.x);
                }

                const baseThrow = 420; // px/s scalar — increase for stronger jump
                const speedScale = Math.min(2.0, Math.max(0.5, s.playSpeed / 120));
                const throwSpeed = Math.max(250, baseThrow * speedScale);

                s.car.vx = Math.cos(segAngle) * throwSpeed * 0.6;
                s.car.vy = -Math.abs(Math.sin(segAngle) * throwSpeed * 0.8) - 180;

                const last = findLastOnStroke(s.path || []) || { x: s.car.x, y: s.car.y };

                s.car.angle = segAngle;
                const CAR_OFFSET = -22;
                s.car.x = last.x + (-Math.sin(s.car.angle) * CAR_OFFSET);
                s.car.y = last.y + (Math.cos(s.car.angle) * CAR_OFFSET);
                s.car.falling = true;

                // ensure visible at start of jump
                s.car.visible = true;
            }

            // --- finish area check (unchanged) ---
            const f = s.finish || { x: 0, y: 0, w: 0, h: 0 };
            const fRect = { x: f.x - f.w / 2, y: f.y - f.h / 2, w: f.w, h: f.h };
            const carRectForFinish = { x: s.car.x - s.car.w / 2, y: s.car.y - s.car.h / 2, w: s.car.w, h: s.car.h };
            if (aabb(carRectForFinish, fRect) && !finishAlertShown.current) {
                finishAlertShown.current = true;

                const completionTime = (Date.now() - s.startTime) / 1000;
                const pathLength = (s.path || []).reduce((total, point, i, arr) => {
                    if (i === 0) return 0;
                    return total + Math.hypot(arr[i].x - arr[i - 1].x, arr[i].y - arr[i - 1].y);
                }, 0);
                const optimalLength = Math.hypot(currentConfig.carStart.x - currentConfig.finishPos.x, currentConfig.carStart.y - currentConfig.finishPos.y);
                const efficiency = pathLength > 0 ? (optimalLength / pathLength) : 0;
                if (completionTime < 5 && efficiency > 0.8);
                else if (completionTime < 8 && efficiency > 0.6);
                setTotalStars(prev => prev + 1);

                // 🎉 BLAST CONFETTI  // 24-12 -- animation //
                finishConfetti = [];
                finishAnimActive = true;
                finishOverlayAlpha = 0;
                finishPhase = 0;
                finishTimer = 0;
                finishHold = true;
                //burstCooldown = 0;

                // 26-12 --winner//
                // 🏆 text reset
                winnerScale = 0;
                winnerAlpha = 1;
                winnerGlow = 0;
                winnerPulse = 0;
                showNextBanner = true;

                // 🔥 1st blast immediately
                spawnFinishBlast(WIDTH, HEIGHT);

                setTimeout(() => setShowNextLevel(false), 400);
                setTimeout(() => spawnFinishBlast(WIDTH, HEIGHT), 800);
                setTimeout(() => setShowLevelComplete(true), 1400); // 26-12 --banner//
                //setTimeout(() => setShowNextLevel(true), 100);

                // stop playing when reached finish
                s.playing = false;
                s.playSpeed = 0;
                s.car.finished = true;
                s.car.falling = false;
            }

            // If car is marked finished stop updating play status:
            if (s.car.finished) {
                s.playing = false;
                s.playSpeed = 0;
            }
        }


        // --- obstacle collisions: stop play & prevent score increments ---
        for (let box of obstacles) {
            const boxRect = { x: box.x, y: box.y, w: box.w, h: box.h };
            const carRect = { x: s.car.x - s.car.w / 2, y: s.car.y - s.car.h / 2, w: s.car.w, h: s.car.h };

            if (aabb(carRect, boxRect)) {
                // STOP everything and mark game over so no score continues
                s.playing = false;
                s.car.falling = false;
                s.car.vy = 0;
                s.car.vx = 0;
                s.playSpeed = 0;
                s.gameOver = true; // new flag to signal an obstacle stop

                // small unstuck push (keep car outside obstacle)
                if (s.car.x < boxRect.x) {
                    s.car.x = boxRect.x - s.car.w / 2 - 1;
                } else if (s.car.x > boxRect.x + boxRect.w) {
                    s.car.x = (boxRect.x + boxRect.w) + s.car.w / 2 + 1;
                }

                if (s.car.y < boxRect.y) {
                    s.car.y = boxRect.y - s.car.h / 2 - 1;
                } else {
                    s.car.y = (boxRect.y + boxRect.h) + s.car.h / 2 + 1;
                }

                // optionally show crash / play sound / set UI state here
            }
        }

        // existing falling branch (keep but improved ordering)
        if (s.car.falling) {
            if (s.car.vx === undefined) s.car.vx = 0;
            if (s.car.vy === undefined) s.car.vy = 0;
            if (s.car.visible === undefined) s.car.visible = true;

            // physics params (tweak)
            const AIR_DRAG = 5.0;
            const MIN_VX = 0;
            const OFFSCREEN_HIDE_Y = HEIGHT + 50;   // hide a bit after bottom
            const STOP_UPDATE_BELOW = HEIGHT + 800;

            // integrate gravity/drag
            s.car.vy += GRAVITY * dt;
            const dragFactor = Math.max(0, 1 - AIR_DRAG * dt);
            s.car.vx *= dragFactor;
            if (Math.abs(s.car.vx) < MIN_VX) s.car.vx = 0;

            // integrate positions (only if you want physics to move while in-air)
            s.car.x += (s.car.vx || 0) * dt;
            s.car.y += s.car.vy * dt;

            // landing on an obstacle (top)
            const under = getTopObstacleUnderCar(s.car, obstacles);
            if (under && (s.car.y + s.car.h) >= under.y) {
                s.car.y = under.y - s.car.h;
                s.car.vy = 0;
                s.car.vx = 0;
                s.car.falling = false;
                s.car.finished = false; // landed on obstacle -> not "finished on ground"
                s.car.visible = true;   // show car when it lands on obstacle
            }

            // hide if it goes off-screen below threshold
            if (s.car.y >= OFFSCREEN_HIDE_Y) {
                s.car.visible = false;
            }

            // stop gameplay if it fell too far
            if (s.car.y >= STOP_UPDATE_BELOW) {
                s.playing = false;
                s.playSpeed = 0;
                s.car.vx = 0;
                s.car.vy = 0;
                // s.gameOver = true; // optional
            }
        } else {
            // when not falling, keep visible only if not finished-on-ground
            // if (s.car.finished) {
            //     // finished landing on ground -> hide if you prefer
            //     s.car.visible = false;
            // } else {
            //     // normal on-path state -> ensure visible
            //     s.car.visible = true;
            // }

            // 22-12-2025//
            if (s.car.finished) {
                s.car.visible = true;   // 👁️ finish પર car દેખાશે
            } else {
                s.car.visible = true;
            }
        }

        // DRAW step: draw only when visible
        if (s.car.visible && s.car.y < HEIGHT + 200) {
            drawCar(ctx, s.car.x, s.car.y, s.car.angle);
        }

        // Score: only while actually playing (not finished, not gameOver)
        // if (!finishAlertShown.current && s.playing && !s.gameOver) {
        //     setScore(Math.floor(s.playProgress / 5));
        // }

        // compute current grid cell
        const GRID_GAP = 35;

        const gx = Math.floor(s.car.x / GRID_GAP);
        const gy = Math.floor(s.car.y / GRID_GAP);

        // initialize last cell if undefined (don't award score on first init)
        if (s.lastGridX === undefined || s.lastGridY === undefined) {
            s.lastGridX = gx;
            s.lastGridY = gy;
        } else {
            // if cell changed, award points
            if (gx !== s.lastGridX || gy !== s.lastGridY) {
                // how many cells were crossed (manhattan)
                const dx = Math.abs(gx - s.lastGridX);
                const dy = Math.abs(gy - s.lastGridY);
                const cellsCrossed = Math.max(1, dx + dy);

                if (!finishAlertShown.current && s.playing && !s.gameOver) {
                    // add 5 points per cell crossed
                    setScore(prev => prev + 5 * cellsCrossed);
                }

                // update last known cell
                s.lastGridX = gx;
                s.lastGridY = gy;
            }
        }



        // --- obstacle collisions: stop play & prevent score increments ---
        for (let box of obstacles) {
            const boxRect = { x: box.x, y: box.y, w: box.w, h: box.h };
            const carRect = { x: s.car.x - s.car.w / 2, y: s.car.y - s.car.h / 2, w: s.car.w, h: s.car.h };

            if (aabb(carRect, boxRect)) {
                // STOP everything and mark game over so no score continues
                s.playing = false;
                s.car.falling = false;
                s.car.vy = 0;
                s.playSpeed = 0;
                s.gameOver = true; // new flag to signal an obstacle stop

                // small unstuck push (keep car outside obstacle)
                if (s.car.x < boxRect.x) {
                    s.car.x = boxRect.x - s.car.w / 2 - 1;
                } else if (s.car.x > boxRect.x + boxRect.w) {
                    s.car.x = (boxRect.x + boxRect.w) + s.car.w / 2 + 1;
                }

                if (s.car.y < boxRect.y) {
                    s.car.y = boxRect.y - s.car.h / 2 - 1;
                } else {
                    s.car.y = (boxRect.y + boxRect.h) + s.car.h / 2 + 1;
                }

                // optionally show crash / play sound / set UI state here
            }
        }

        // --- falling physics when car is falling ---
        // if (s.car.falling) {
        //     s.car.vy += GRAVITY * dt;
        //     s.car.y += s.car.vy * dt;

        //     const under = getTopObstacleUnderCar(s.car, obstacles);

        //     if (under && (s.car.y + s.car.h) >= under.y) {
        //         s.car.y = under.y - s.car.h;
        //         s.car.vy = 0;
        //         s.car.falling = false;
        //     }
        // }


        // --- draw stage ---
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = currentConfig?.bgColor ?? '#fff';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);

        drawGrid(ctx);

        //19-12//
        // 🚗 DRAW PETROL PUMP (Level 21+)
        if (s.petrolPump && !s.petrolPump.used) {
            drawPetrolPump(ctx, s.petrolPump);
        }

        // ⛽ DRAW FUEL BAR (Level 21+)
        if (s.petrolPump) {
            drawFuelBar(ctx, s.car);
        }

        drawObstacles(ctx, obstacles);



        // 19-12//
        // ⛽ PETROL PUMP CALL — ⭐ અહીં ⭐
        const config = s.config || {};
        if (config?.petrolPump) {
            const pumps = Array.isArray(config.petrolPump)
                ? config.petrolPump
                : [config.petrolPump];

            pumps.forEach(pump => {
                if (!pump.used) {        // 👈 only hide AFTER touch
                    drawPetrolPump(ctx, pump);
                }
            });
        }


        //stateRef.current.config = config;

        // Draw the path (line) first
        if (s.path && s.path.length > 0) {

            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 4;
            ctx.lineWidth = 5;
            ctx.strokeStyle = currentConfig?.pathColor ?? '#f55';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            const pts = s.path;
            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                if (p.break === true || i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            }
            ctx.stroke();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;


        }

        // Draw finish flag
        const finish = s.finish || { x: 0, y: 0, w: 0 };
        drawCheckeredFlag(ctx, finish.x, finish.y, finish.w);

        // if (s.car.y < HEIGHT + 200) drawCar(ctx, s.car.x, s.car.y, s.car.angle);
        // only draw if visible flag is true and car isn't extremely far below
        // if (s.car.visible !== false && s.car.y < HEIGHT + 100) {
        //     drawCar(ctx, s.car.x, s.car.y, s.car.angle);
        // }
        //20-12//
        if (s.car.visible !== false) {
            drawCar(ctx, s.car.x, s.car.y, s.car.angle);
        }


        // 19-12//
        // ⛽ FUEL BAR CALL — ⭐ અહી ADD કર ⭐
        if (s.car && typeof s.car.fuel === "number") {
            drawFuelBar(ctx, s.car);
        }

        // 19 - 12 //
        if (s.petrolPump && !s.petrolPump.used) {
            if (checkPetrolPumpCollision(s.car, s.petrolPump)) {
                s.car.fuel = s.car.maxFuel;
                s.petrolPump.used = true;
                s.car.justRefueled = true;
            }
        }

        // function checkPetrolPumpCollision(car, pump) {
        //     const dx = car.x - pump.x;
        //     const dy = car.y - pump.y;
        //     return Math.hypot(dx, dy) < pump.r + car.w / 2;
        // }
        if (s.car.justRefueled) {
            s.car.justRefueled = false;
        }

        // 24-12 --animation//
        // 🌑 DARK OVERLAY (ONLY AFTER PHASE 1) - Draw on top of everything
        if (finishAnimActive && finishPhase === 1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${finishOverlayAlpha})`;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        // 🎉 CONFETTI DRAW - Draw on top of the line
        finishConfetti.forEach(p => {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;

            ctx.strokeStyle = p.color;
            ctx.fillStyle = p.color;

            if (p.line) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(
                    p.x - p.vx * 3,
                    p.y - p.vy * 3
                );
                ctx.stroke();
            } else {
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        });
        ctx.globalAlpha = 1;

        // 26-12 --winner//
        // Draw WINNER text on top of everything
        if (finishAnimActive) {
            ctx.save();

            winnerPulse += 0.08;
            const pulse = 1 + Math.sin(winnerPulse) * 0.06;

            ctx.translate(WIDTH / 2, HEIGHT / 2 - 40);
            ctx.scale(winnerScale * pulse, winnerScale * pulse);
            ctx.globalAlpha = winnerAlpha;

            // 🌟 GLOW LAYER
            ctx.shadowColor = 'rgba(255, 215, 100, 0.9)';
            ctx.shadowBlur = winnerGlow;

            // 🏆 GOLD GRADIENT TEXT
            const grad = ctx.createLinearGradient(0, -50, 0, 50);
            grad.addColorStop(0, '#fff4a3');
            grad.addColorStop(0.4, '#ffd34d');
            grad.addColorStop(0.7, '#ffb703');
            grad.addColorStop(1, '#c88900');

            ctx.fillStyle = grad;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '900 78px Poppins, Arial';

            ctx.fillText('WINNER!', 0, 0);

            // ✨ SHINE STROKE
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.strokeText('WINNER!', 0, 0);

            // ⭐ STARS DECOR (animated glow)
            // ctx.shadowBlur = 0;
            // ctx.font = 'bold 26px Arial';
            // ctx.fillStyle = '#ffe066';
            // ctx.fillText('⭐   ⭐   ⭐', 0, 62);

            ctx.restore();
            ctx.globalAlpha = 1;
        }

        // continue loop
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
        drawCar(ctx, s.car.x, s.car.y, s.car.angle);
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

        setScore(0);
        setMode('draw');
        setShowNextLevel(false);
        setGameStarted(false);
        setGameOver(false);  // 16-01 -- car restart moving//
        setShowLevelComplete(false); // 16-01  -- car restart moving//
    };


    const goToNextLevel = () => {
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

                    <div className="canvas-wrapper mb-4 position-relative">
                        {/* 13-01 <canvas ref={canvasRef} data-testid="game-canvas" />*/}


                        <canvas
                            ref={canvasRef}
                            width={WIDTH}
                            height={HEIGHT}
                            style={{
                                width: "100%",
                                maxWidth: "100%",
                                maxHeight: "calc(100vh - 180px)",
                                height: "auto",
                                aspectRatio: "1250 / 600",
                                display: "block",
                                margin: "0 auto",
                                touchAction: "none"
                            }}
                        />

                        {/* Overlay Controls */}
                        <div className={`canvas-overlay-controls ${gameStarted ? 'game-active-controls' : ''}`}>
                            {!gameStarted ? (
                                <div className="d-flex gap-2 justify-content-center flex-wrap">
                                    <button onClick={() => setMode('draw')} className={`btn btn-info btn-game ${mode === 'draw' ? 'active' : ''}`} data-testid="draw-btn">Draw</button>
                                    <button onClick={startPlay} className="btn btn-success btn-game" data-testid="start-btn">Start</button>
                                    <button onClick={restartLevel} className="btn btn-danger btn-game" data-testid="clear-btn">Clear</button>
                                </div>
                            ) : (
                                <div className={`bottom-tools ${showLevelComplete ? 'hide-tools' : ''}`}>
                                    <div className="d-flex align-items-center" style={{ gap: '15px' }}>
                                        {/* 🔄 RESTART BUTTON */}
                                        <button onClick={restartLevel} className="btn-icon-styled btn-restart-styled" title="Restart" data-testid="restart-btn">
                                            <div className="icon-inner">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 12C4 16.4183 7.58172 20 12 20C14.7359 20 17.1524 18.6256 18.621 16.5M4 12C4 7.58172 7.58172 4 12 4C14.4446 4 16.6347 5.09706 18.125 6.875M4 12V6M18.125 6.875V3M18.125 6.875H13.625" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        {/* ✏️ ERASER BUTTON */}
                                        <button onClick={restartLevel} className="btn-icon-styled btn-eraser-styled" title="Eraser" data-testid="eraser-btn">
                                            <div className="icon-inner">
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

                        {/* 26-12 --banner*/}
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
                                    <div className="lc-banner">LEVEL COMPLETE</div>
                                    <div className="lc-subtitle">Amazing work! You're unstoppable!</div>

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
                                            ↻ Restart Level
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