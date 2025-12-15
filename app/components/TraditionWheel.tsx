'use client';

import { useEffect, useRef, useState } from 'react';
import type { TraditionItem } from '@/types';

interface TraditionWheelProps {
  traditions: TraditionItem[];
  selectedTradition: TraditionItem | null;
  spinning: boolean;
  lang: 'en' | 'cs';
  onSpinComplete?: (selectedTradition: TraditionItem) => void;
}

export default function TraditionWheel({
  traditions,
  selectedTradition,
  spinning,
  lang,
  onSpinComplete,
}: TraditionWheelProps) {
  const DEBUG = process.env.NODE_ENV !== 'production';
  const wheelRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const selectedIndexRef = useRef<number | null>(null);

  const norm = (deg: number) => ((deg % 360) + 360) % 360;
  const angDist = (a: number, b: number) => {
    let d = Math.abs(a - b);
    if (d > 180) d = 360 - d;
    return d;
  };
  const indexAtTop = (rotationDeg: number): number | null => {
    const n = traditions.length;
    if (!n) return null;
    const segmentAngle = 360 / n;

    // Our segments are drawn with 0° at TOP, increasing clockwise.
    // CSS rotate(+) rotates the wheel clockwise, so a point at angle theta moves to theta + rotation.
    // The pointer is fixed at top (absolute 0°). The wheel angle that ends up at the pointer is:
    //   theta + rotation = 0  (mod 360)  =>  theta = -rotation (mod 360) = 360 - rotationNorm
    const pointerTheta = norm(360 - norm(rotationDeg));

    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      const center = i * segmentAngle + segmentAngle / 2;
      const d = angDist(pointerTheta, center);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (DEBUG && n <= 24) {
      // Keeping this readable; n can get big.
      console.log('[TraditionWheel] indexAtTop()', {
        rotationDeg,
        rotationNorm: norm(rotationDeg),
        pointerTheta,
        best,
        bestCenter: best * segmentAngle + segmentAngle / 2,
        bestD,
        n,
      });
    }
    return best;
  };

  const colors = [
    { from: '#DC2626', to: '#B91C1C' }, // red
    { from: '#16A34A', to: '#15803D' }, // green
    { from: '#F59E0B', to: '#D97706' }, // gold
    { from: '#D97706', to: '#B45309' }, // bronze
  ];

  useEffect(() => {
    // Simplest reliable logic:
    // - When a spin starts, pick a final index (or honor selectedTradition if provided)
    // - Compute a target rotation that places THAT index at the top
    // - Use only INTEGER full turns (never fractional), so the final angle is deterministic
    // - After the spin, compute the index-at-top from the final rotation and return it
    if (spinning && traditions.length > 0) {
      setIsAnimating(true);
      setHighlightedIndex(null);
      setHoveredIndex(null);
      
      const n = traditions.length;
      const segmentAngle = 360 / n;
      
      // Decide which index we are spinning to.
      const desiredIndex =
        selectedTradition ? traditions.findIndex((t) => t.id === selectedTradition.id) : -1;
      const finalIndex = desiredIndex >= 0 ? desiredIndex : Math.floor(Math.random() * n);
      selectedIndexRef.current = finalIndex;
      
      // Target rotation so the selected segment center is under the top pointer.
      // We want: pointerTheta == selectedCenter
      // pointerTheta = 360 - rotationNorm  =>  360 - rotationNorm = selectedCenter  =>  rotationNorm = 360 - selectedCenter
      const selectedCenter = finalIndex * segmentAngle + segmentAngle / 2;
      const targetNorm = norm(360 - selectedCenter);
      
      // Add multiple full rotations for a spinning effect (4-6 full rotations) — MUST be integer.
      const fullTurns = 4 + Math.floor(Math.random() * 3); // 4,5,6
      
      const currentNorm = norm(rotationRef.current);
      const rotationNeeded = norm(targetNorm - currentNorm); // [0, 360)
      const targetRotation = rotationRef.current + fullTurns * 360 + rotationNeeded;

      if (DEBUG) {
        console.log('[TraditionWheel] spin start', {
          traditionsLen: traditions.length,
          selectedTraditionId: selectedTradition?.id ?? null,
          desiredIndex,
          finalIndex,
          segmentAngle,
          selectedCenter,
          targetNorm,
          fullTurns,
          currentRotation: rotationRef.current,
          currentNorm,
          rotationNeeded,
          targetRotation,
          targetRotationNorm: norm(targetRotation),
        });
      }
      
      // Update highlighted index during spin
      const startTime = Date.now();
      const startRotation = rotationRef.current;
      const duration = 3500; // 3.5 seconds
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration (ease-out-cubic)
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentRotation = startRotation + (targetRotation - startRotation) * easeOutCubic;
        
        rotationRef.current = currentRotation;
        setRotation(currentRotation);
        
        const idx = indexAtTop(currentRotation);
        if (idx !== null) setHighlightedIndex(idx);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          rotationRef.current = targetRotation;
          setRotation(targetRotation);
          const topIdx = indexAtTop(targetRotation);
          if (topIdx === null) return;

          setHighlightedIndex(topIdx);
          selectedIndexRef.current = topIdx;

          const actualSelectedTradition = traditions[topIdx];
          if (DEBUG) {
            console.log('[TraditionWheel] spin end', {
              targetRotation,
              targetRotationNorm: norm(targetRotation),
              computedTopIdx: topIdx,
              computedTopId: actualSelectedTradition?.id ?? null,
              computedTopLabel: actualSelectedTradition?.[lang] ?? null,
              n: traditions.length,
            });
          }
          if (onSpinComplete && actualSelectedTradition) onSpinComplete(actualSelectedTradition);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [spinning, traditions, selectedTradition, onSpinComplete]);

  if (traditions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-white/70 text-lg">No traditions available</p>
      </div>
    );
  }

  const segmentAngle = 360 / traditions.length;
  const radius = 180; // Wheel radius in pixels
  const centerX = 192;
  const centerY = 192;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Pointer indicator at the top */}
      <div className="relative z-20 mb-2">
        <div className="w-0 h-0 border-l-[18px] sm:border-l-[24px] border-l-transparent border-r-[18px] sm:border-r-[24px] border-r-transparent border-t-[28px] sm:border-t-[36px] border-t-christmas-gold drop-shadow-2xl filter brightness-110" />
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-christmas-gold shadow-lg" />
      </div>

      {/* Wheel container */}
      <div className="relative w-[90vw] h-[90vw] max-w-96 max-h-96 md:w-[28rem] md:h-[28rem]">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-christmas-gold/30 via-christmas-green/30 to-christmas-red/30 blur-2xl animate-pulse-slow" />
        
        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative w-full h-full rounded-full overflow-visible border-4 border-christmas-gold/50 shadow-2xl"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isAnimating ? 'none' : 'transform 0.5s ease-out',
          }}
        >
          {/* Segments */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 384 384" style={{ overflow: 'visible' }}>
            {traditions.map((tradition, index) => {
              const startAngle = index * segmentAngle;
              const endAngle = (index + 1) * segmentAngle;
              const midAngle = (startAngle + endAngle) / 2;
              
              // Convert angle to radians (SVG uses 0° at 3 o'clock, we want 0° at top)
              const startRad = ((startAngle - 90) * Math.PI) / 180;
              const endRad = ((endAngle - 90) * Math.PI) / 180;
              
              const x1 = centerX + radius * Math.cos(startRad);
              const y1 = centerY + radius * Math.sin(startRad);
              const x2 = centerX + radius * Math.cos(endRad);
              const y2 = centerY + radius * Math.sin(endRad);
              
              const largeArcFlag = segmentAngle > 180 ? 1 : 0;
              
              const color = colors[index % colors.length];
              const isHighlighted = highlightedIndex === index && isAnimating;
              const isHovered = hoveredIndex === index && !isAnimating;
              
              const updateTooltipPosition = (e: React.MouseEvent<SVGPathElement>) => {
                // Position tooltip near the segment center
                const midAngleRad = ((midAngle - 90) * Math.PI) / 180;
                const tooltipRadius = radius * 0.6;
                const tooltipX = centerX + tooltipRadius * Math.cos(midAngleRad);
                const tooltipY = centerY + tooltipRadius * Math.sin(midAngleRad);
                
                setTooltipPosition({ 
                  x: (tooltipX / 384) * 100, 
                  y: (tooltipY / 384) * 100 
                });
              };
              
              const handleMouseEnter = (e: React.MouseEvent<SVGPathElement>) => {
                if (!isAnimating) {
                  setHoveredIndex(index);
                  updateTooltipPosition(e);
                }
              };
              
              const handleMouseMove = (e: React.MouseEvent<SVGPathElement>) => {
                if (!isAnimating && hoveredIndex === index) {
                  updateTooltipPosition(e);
                }
              };
              
              const handleMouseLeave = () => {
                if (!isAnimating) {
                  setHoveredIndex(null);
                }
              };
              
              return (
                <g key={tradition.id}>
                  <defs>
                    <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={
                        isHighlighted ? '#F59E0B' : 
                        isHovered ? '#F59E0B' : 
                        color.from
                      } stopOpacity={
                        isHighlighted ? '1' : 
                        isHovered ? '0.95' : 
                        '0.85'
                      } />
                      <stop offset="100%" stopColor={
                        isHighlighted ? '#D97706' : 
                        isHovered ? '#D97706' : 
                        color.to
                      } stopOpacity={
                        isHighlighted ? '0.9' : 
                        isHovered ? '0.85' : 
                        '0.7'
                      } />
                    </linearGradient>
                  </defs>
                  <path
                    data-seg-index={index}
                    d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                    fill={`url(#gradient-${index})`}
                    stroke={isHovered ? 'rgba(245, 158, 11, 0.8)' : 'rgba(255, 255, 255, 0.4)'}
                    strokeWidth={isHovered ? '3' : '2'}
                    style={{
                      filter: (isHighlighted || isHovered) 
                        ? 'brightness(1.4) drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))' 
                        : 'none',
                      transition: 'filter 0.15s ease-out, stroke 0.15s ease-out, stroke-width 0.15s ease-out',
                      cursor: isAnimating ? 'default' : 'pointer',
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Text labels */}
          {traditions.map((tradition, index) => {
            const startAngle = index * segmentAngle;
            const endAngle = (index + 1) * segmentAngle;
            const midAngle = (startAngle + endAngle) / 2;
            const labelRadius = radius * 0.75;
            const labelX = centerX + labelRadius * Math.cos(((midAngle - 90) * Math.PI) / 180);
            const labelY = centerY + labelRadius * Math.sin(((midAngle - 90) * Math.PI) / 180);
            const isHighlighted = highlightedIndex === index && isAnimating;
            
            return (
              <div
                key={`label-${tradition.id}`}
                className="absolute"
                style={{
                  left: `${(labelX / 384) * 100}%`,
                  top: `${(labelY / 384) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <div
                  className="text-xs md:text-sm font-bold text-white whitespace-nowrap px-2 py-1 rounded-md backdrop-blur-md border"
                  style={{
                    transform: `rotate(${-midAngle}deg)`,
                    backgroundColor: isHighlighted 
                      ? 'rgba(245, 158, 11, 0.5)' 
                      : 'rgba(0, 0, 0, 0.4)',
                    borderColor: isHighlighted 
                      ? 'rgba(245, 158, 11, 0.8)' 
                      : 'rgba(255, 255, 255, 0.2)',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
                    maxWidth: '140px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    transition: 'all 0.15s ease-out',
                    scale: isHighlighted ? '1.1' : '1',
                  }}
                >
                  {tradition[lang]}
                </div>
              </div>
            );
          })}

          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-christmas-gold via-christmas-bronze to-christmas-gold border-4 border-white/40 shadow-2xl flex items-center justify-center">
              <span className="text-5xl filter drop-shadow-lg">🎄</span>
            </div>
          </div>
        </div>

        {/* Decorative rings */}
        <div className="absolute inset-2 rounded-full border-2 border-white/30 pointer-events-none z-10" />
        <div className="absolute inset-4 rounded-full border border-white/20 pointer-events-none z-10" />
        
        {/* Tooltip */}
        {hoveredIndex !== null && !isAnimating && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}%`,
              top: `${tooltipPosition.y}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="bg-christmas-gold/95 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-2xl border-2 border-christmas-gold max-w-[80vw] whitespace-normal break-words text-center animate-scale-in">
              <p className="font-bold text-sm md:text-base drop-shadow-lg leading-snug">
                {traditions[hoveredIndex]?.[lang]}
              </p>
              {/* Tooltip arrow pointing down */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-christmas-gold" />
            </div>
          </div>
        )}
      </div>

      {/* Currently highlighted tradition (shown during spin) */}
      {isAnimating && highlightedIndex !== null && (
        <div className="mt-8 text-center animate-pulse">
          <p className="text-sm text-white/70 mb-2">✨ Spinning... ✨</p>
          <p className="text-2xl font-bold text-christmas-gold drop-shadow-lg">
            {traditions[highlightedIndex]?.[lang]}
          </p>
        </div>
      )}
    </div>
  );
}
