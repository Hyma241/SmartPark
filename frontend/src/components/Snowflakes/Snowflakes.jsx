import React from 'react';
import styles from './Snowflakes.module.css';

const SnowflakeSVG = ({ color, size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
    <line x1="9" y1="5" x2="12" y2="8" /><line x1="15" y1="5" x2="12" y2="8" />
    <line x1="9" y1="19" x2="12" y2="16" /><line x1="15" y1="19" x2="12" y2="16" />
    <line x1="5" y1="9" x2="8" y2="12" /><line x1="5" y1="15" x2="8" y2="12" />
    <line x1="19" y1="9" x2="16" y2="12" /><line x1="19" y1="15" x2="16" y2="12" />
  </svg>
);

// Larger sizes, spread across the viewport; floats gently in place (no falling)
const FLAKES = [
  { id:0,  left:5,   top:8,   size:56, color:'#a855f7', spinDur:8,  opacity:0.55, delayF:0   },
  { id:1,  left:15,  top:55,  size:40, color:'#6366f1', spinDur:12, opacity:0.45, delayF:1.2 },
  { id:2,  left:25,  top:22,  size:72, color:'#7c3aed', spinDur:10, opacity:0.5,  delayF:0.5 },
  { id:3,  left:38,  top:70,  size:36, color:'#38bdf8', spinDur:14, opacity:0.4,  delayF:2   },
  { id:4,  left:50,  top:15,  size:64, color:'#c084fc', spinDur:9,  opacity:0.5,  delayF:0.8 },
  { id:5,  left:62,  top:45,  size:44, color:'#818cf8', spinDur:11, opacity:0.45, delayF:1.5 },
  { id:6,  left:75,  top:80,  size:76, color:'#a855f7', spinDur:7,  opacity:0.55, delayF:0.3 },
  { id:7,  left:88,  top:30,  size:40, color:'#6366f1', spinDur:13, opacity:0.4,  delayF:1.8 },
  { id:8,  left:93,  top:65,  size:52, color:'#38bdf8', spinDur:9,  opacity:0.5,  delayF:0.6 },
  { id:9,  left:8,   top:85,  size:32, color:'#c084fc', spinDur:15, opacity:0.35, delayF:2.5 },
  { id:10, left:32,  top:40,  size:48, color:'#7c3aed', spinDur:10, opacity:0.5,  delayF:0.4 },
  { id:11, left:47,  top:90,  size:28, color:'#818cf8', spinDur:16, opacity:0.3,  delayF:3   },
  { id:12, left:58,  top:5,   size:68, color:'#a855f7', spinDur:8,  opacity:0.55, delayF:0.2 },
  { id:13, left:70,  top:58,  size:36, color:'#6366f1', spinDur:12, opacity:0.4,  delayF:1.6 },
  { id:14, left:82,  top:18,  size:56, color:'#38bdf8', spinDur:9,  opacity:0.5,  delayF:0.9 },
  { id:15, left:20,  top:72,  size:44, color:'#c084fc', spinDur:11, opacity:0.45, delayF:2.2 },
  { id:16, left:42,  top:32,  size:32, color:'#7c3aed', spinDur:14, opacity:0.4,  delayF:1   },
  { id:17, left:55,  top:62,  size:60, color:'#818cf8', spinDur:8,  opacity:0.5,  delayF:0.7 },
  { id:18, left:78,  top:42,  size:40, color:'#a855f7', spinDur:10, opacity:0.45, delayF:1.4 },
  { id:19, left:3,   top:48,  size:64, color:'#6366f1', spinDur:9,  opacity:0.5,  delayF:0.5 },
  { id:20, left:65,  top:88,  size:28, color:'#38bdf8', spinDur:13, opacity:0.35, delayF:2.8 },
  { id:21, left:90,  top:8,   size:72, color:'#c084fc', spinDur:7,  opacity:0.55, delayF:0.1 },
  { id:22, left:35,  top:95,  size:36, color:'#7c3aed', spinDur:15, opacity:0.35, delayF:3.2 },
  { id:23, left:12,  top:28,  size:52, color:'#818cf8', spinDur:10, opacity:0.5,  delayF:0.6 },
  { id:24, left:48,  top:50,  size:32, color:'#a855f7', spinDur:12, opacity:0.4,  delayF:1.8 },
  { id:25, left:72,  top:25,  size:44, color:'#6366f1', spinDur:9,  opacity:0.45, delayF:1.1 },
  { id:26, left:85,  top:75,  size:56, color:'#38bdf8', spinDur:11, opacity:0.5,  delayF:0.4 },
  { id:27, left:28,  top:12,  size:28, color:'#c084fc', spinDur:16, opacity:0.3,  delayF:2.4 },
];

const Snowflakes = () => (
  <div className={styles.snowContainer} aria-hidden="true">
    {FLAKES.map(f => (
      <div
        key={f.id}
        className={styles.flake}
        style={{
          left: `${f.left}%`,
          top: `${f.top}%`,
          animationDelay: `${f.delayF}s`,
          '--spin-dur': `${f.spinDur}s`,
          '--float-amp': `${f.floatAmp}px`,
          opacity: f.opacity,
          filter: `drop-shadow(0 0 5px ${f.color}) drop-shadow(0 0 10px ${f.color})`,
        }}
      >
        <SnowflakeSVG color={f.color} size={f.size} />
      </div>
    ))}
  </div>
);

export default Snowflakes;
