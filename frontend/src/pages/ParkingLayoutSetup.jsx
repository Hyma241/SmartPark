import React, { useState, useRef, useEffect } from 'react';
import { MousePointer2, PenTool, Edit2, Trash2, XCircle, Save, Info } from 'lucide-react';
import Button from '../components/Button/Button';
import { db } from '../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import styles from './ParkingLayoutSetup.module.css';

const ParkingLayoutSetup = () => {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState('select'); // select, draw, edit, delete
  const [polygons, setPolygons] = useState([]); // { id, points: [{x, y}], label, status }
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedPolyId, setSelectedPolyId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const svgRef = useRef(null);

  useEffect(() => {
    // Load existing layout from Firebase
    const loadLayout = async () => {
      if (!currentUser) return;
      try {
        const docSnap = await getDoc(doc(db, "parkingLayouts", currentUser.uid));
        if (docSnap.exists()) {
          setPolygons(docSnap.data().slots || []);
        }
      } catch (e) {
        console.error("Failed to load layout", e);
      }
    };
    loadLayout();
  }, [currentUser]);

  const getSVGCoordinates = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const handleMouseMove = (e) => {
    if (mode === 'draw' && currentPolygon.length > 0) {
      setMousePos(getSVGCoordinates(e));
    }
  };

  const handleClick = (e) => {
    if (mode === 'draw') {
      const coords = getSVGCoordinates(e);
      setCurrentPolygon([...currentPolygon, coords]);
    }
  };

  const handleDoubleClick = (e) => {
    if (mode === 'draw' && currentPolygon.length >= 3) {
      // Finish polygon
      const newPoly = {
        id: Date.now().toString(),
        points: currentPolygon,
        label: `S${polygons.length + 1}`
      };
      setPolygons([...polygons, newPoly]);
      setCurrentPolygon([]);
    }
  };

  const handlePolyClick = (e, polyId) => {
    e.stopPropagation();
    if (mode === 'delete') {
      setPolygons(polygons.filter(p => p.id !== polyId));
    } else if (mode === 'select' || mode === 'edit') {
      setSelectedPolyId(polyId);
    }
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all slots?')) {
      setPolygons([]);
      setCurrentPolygon([]);
    }
  };

  const saveLayout = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "parkingLayouts", currentUser.uid), {
        slots: polygons,
        updatedAt: new Date()
      });
      // Also send to FastAPI backend to update the YOLO engine's current active layout
      await fetch("/api/layout/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: polygons })
      }).catch(e => console.warn("Backend not reachable", e));
      
      alert("Layout saved successfully!");
    } catch (e) {
      console.error("Save error", e);
      alert("Failed to save layout.");
    }
    setSaving(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Parking Layout Setup</h1>
          <p className={styles.subtitle}>Define parking slots by drawing on the camera feed</p>
        </div>
        <Button variant="primary" onClick={saveLayout} disabled={saving} icon={<Save size={18}/>}>
          {saving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolsGroup}>
          <button className={`${styles.toolBtn} ${mode === 'select' ? styles.active : ''}`} onClick={() => setMode('select')}><MousePointer2 size={16}/> Select</button>
          <button className={`${styles.toolBtn} ${mode === 'draw' ? styles.active : ''}`} onClick={() => {setMode('draw'); setCurrentPolygon([]); setSelectedPolyId(null);}}><PenTool size={16}/> Draw</button>
          <button className={`${styles.toolBtn} ${mode === 'edit' ? styles.active : ''}`} onClick={() => setMode('edit')}><Edit2 size={16}/> Edit</button>
          <button className={`${styles.toolBtn} ${mode === 'delete' ? styles.active : ''}`} onClick={() => setMode('delete')}><Trash2 size={16}/> Delete</button>
        </div>
        <button className={styles.clearBtn} onClick={clearAll}><XCircle size={16}/> Clear</button>
      </div>

      <div className={styles.canvasWrapper}>
        <svg 
          ref={svgRef}
          className={styles.svgCanvas}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* Render Existing Polygons */}
          {polygons.map(poly => {
            const pointsStr = poly.points.map(p => `${p.x},${p.y}`).join(' ');
            const isSelected = selectedPolyId === poly.id;
            // No mock visualization during setup, just show neutral bounding box
            const fillColor = 'rgba(99, 102, 241, 0.2)'; // Primary color with transparency
            const strokeColor = 'var(--primary-color)';
            let cx = 0, cy = 0;
            poly.points.forEach(p => { cx += p.x; cy += p.y; });
            cx /= poly.points.length;
            cy /= poly.points.length;

            return (
              <g key={poly.id} onClick={(e) => handlePolyClick(e, poly.id)} style={{ cursor: mode === 'delete' ? 'no-drop' : 'pointer' }}>
                <polygon 
                  points={pointsStr} 
                  fill={fillColor} 
                  stroke={isSelected ? '#fff' : strokeColor} 
                  strokeWidth={isSelected ? 3 : 2} 
                />
                <text x={cx} y={cy} fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                  {poly.label}
                </text>
              </g>
            );
          })}

          {/* Render Current Drawing Polygon */}
          {currentPolygon.length > 0 && (
            <polyline 
              points={[...currentPolygon, mousePos].map(p => `${p.x},${p.y}`).join(' ')} 
              fill="rgba(124, 58, 237, 0.2)" 
              stroke="var(--primary-color)" 
              strokeWidth="2" 
              strokeDasharray="4"
            />
          )}
          {currentPolygon.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--primary-color)" />
          ))}
        </svg>

        <div className={styles.tipBox}>
          <Info size={16} />
          <span>Tip: Click points to draw parking slot. Double click to finish.</span>
        </div>
      </div>
    </div>
  );
};

export default ParkingLayoutSetup;
