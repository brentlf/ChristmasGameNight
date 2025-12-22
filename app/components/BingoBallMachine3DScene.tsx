// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Scene } from './BingoBallMachine3D';

interface BingoBallMachine3DSceneProps {
  spinning: boolean;
  spinPhase: 'fast' | 'slow' | null;
  ballInTransit: string | null;
  transitProgress: number;
  displayBall: string | null;
  revealing: boolean;
  onError?: () => void;
}

export default function BingoBallMachine3DScene(props: BingoBallMachine3DSceneProps) {
  useEffect(() => {
    // Log when component mounts to verify it's loading
    console.log('BingoBallMachine3DScene mounted');
    return () => {
      console.log('BingoBallMachine3DScene unmounted');
    };
  }, []);

  try {
    return (
      <Canvas
        // Slight zoom-out so the dome never clips at the top
        camera={{ position: [0, 0.55, 5.7], fov: 45 }}
        gl={{ 
          antialias: true, 
          alpha: true, // Transparent background
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false
        }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]} // Limit pixel ratio for TV performance
        frameloop="always" // Keep animations smooth
        onCreated={(state) => {
          // Enable shadows in the renderer
          state.gl.shadowMap.enabled = true;
          console.log('Canvas created', state);
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent' // Transparent background
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0.55, 5.7]} fov={45} />
        <Scene {...props} />
      </Canvas>
    );
  } catch (error) {
    console.error('Error rendering 3D scene:', error);
    props.onError?.();
    return null;
  }
}

