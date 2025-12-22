// @ts-nocheck
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const INNER_BALLS_COUNT = 16;

// 3D Scene Components
export function Drum({ spinning, spinPhase }: { spinning: boolean; spinPhase: 'fast' | 'slow' | null }) {
  const drumRef = useRef<THREE.Mesh>(null);
  const innerBallsRef = useRef<THREE.Group>(null);
  const agitatorRef = useRef<THREE.Group>(null);
  const ballVelsRef = useRef<Array<THREE.Vector3>>([]);
  const ballInitialPositionsRef = useRef<Array<[number, number, number]>>([]); // stable initial positions (no rerender teleport)
  const tmpVec = useRef(new THREE.Vector3()); // Reusable temp vector
  const spinStartTimeRef = useRef<number | null>(null); // Track when spinning started for ramp-up

  // Initialize velocities for each ball
  // Drum sphere: center at [0, 1.4, 0], radius 1.2
  // innerBallsRef group is at [0, 0.6, 0]
  // So relative to the group, drum center is at [0, 0.8, 0] (1.4 - 0.6 = 0.8)
  if (ballVelsRef.current.length === 0) {
    for (let i = 0; i < INNER_BALLS_COUNT; i++) {
      ballVelsRef.current.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ));
    }
  }

  // Initialize stable starting positions ONCE (so balls don't jump on rerenders)
  // We start them near the bottom area to read as "idle on load".
  if (ballInitialPositionsRef.current.length === 0) {
    const targetY = -0.2;
    const maxR = 0.75;
    for (let i = 0; i < INNER_BALLS_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * maxR;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = targetY + (Math.random() - 0.5) * 0.06; // small vertical variance
      ballInitialPositionsRef.current.push([x, y, z]);
      // Start nearly at rest so "idle" doesn't look like it's already mixing
      ballVelsRef.current[i]?.set(0, 0, 0);
    }
  }

  useFrame((state: any, delta: number) => {
    // Drum rotation - subtle, agitator is the star
    if (drumRef.current && spinning && spinPhase) {
      // Drum rotates slowly (optional visual element)
      const baseSpeed = spinPhase === 'fast' ? 0.8 : 0.4; // Much slower than agitator
      const variation = Math.sin(state.clock.elapsedTime * 3) * 0.05;
      const rotationSpeed = (baseSpeed + variation) * delta;
      drumRef.current.rotation.y += rotationSpeed;
    }

    // Track spin start time for ramp-up calculation
    if (spinning && spinPhase === 'fast' && spinStartTimeRef.current === null) {
      spinStartTimeRef.current = state.clock.elapsedTime;
    } else if (!spinning) {
      spinStartTimeRef.current = null;
    }

    // Agitator is the star - ramp up, then full speed, then slow down
    if (agitatorRef.current && spinning) {
      if (spinPhase === 'fast') {
        // Fast mixing: strong rotation (full speed after ramp-up)
        const elapsed = spinStartTimeRef.current !== null 
          ? state.clock.elapsedTime - spinStartTimeRef.current 
          : 0;
        const rampDuration = 0.4; // 400ms ramp-up phase
        
        let a: number;
        if (elapsed < rampDuration) {
          // Ramp-up phase (0.0s → 0.4s): gradually increase speed
          const rampProgress = elapsed / rampDuration;
          // Smooth ease-in for ramp-up
          const easedProgress = rampProgress * rampProgress; // Quadratic ease-in
          a = 6.0 * easedProgress; // Ease from 0 to full speed
        } else {
          // Full speed phase (0.4s → 3.5s): maintain full speed
          a = 6.0; // radians/sec
        }
        
        agitatorRef.current.rotation.y += a * delta;
        // Small wobble for realism
        agitatorRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 6) * 0.05;
      } else if (spinPhase === 'slow') {
        // Slow mixing: decay with inertia (doesn't stop instantly)
        // Gradually slow down to create natural decay feel
        if (!agitatorRef.current.userData.decaySpeed) {
          agitatorRef.current.userData.decaySpeed = 2.5; // Start from previous speed
        }
        // Decay speed over time (inertia)
        agitatorRef.current.userData.decaySpeed *= 0.95; // Exponential decay
        agitatorRef.current.userData.decaySpeed = Math.max(0.1, agitatorRef.current.userData.decaySpeed); // Don't go negative
        agitatorRef.current.rotation.y += agitatorRef.current.userData.decaySpeed * delta;
        // Less wobble as it slows
        agitatorRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 6) * 0.03 * (agitatorRef.current.userData.decaySpeed / 2.5);
      }
    } else if (agitatorRef.current && !spinning) {
      // Reset when not spinning
      agitatorRef.current.userData.decaySpeed = undefined;
    }

    if (innerBallsRef.current) {
      const center = new THREE.Vector3(0, 0.8, 0); // Drum center relative to group
      
      // Collect all ball meshes first (skip agitator group which contains hub and spokes)
      const ballMeshes: THREE.Mesh[] = [];
      innerBallsRef.current.children.forEach((obj: THREE.Object3D, i: number) => {
        // Skip the agitator group (index 0) - it contains hub and spokes
        if (i === 0) return; // Skip agitator group
        
        // All remaining children should be ball meshes
        if (obj instanceof THREE.Mesh) {
          ballMeshes.push(obj);
        }
      });
      
      // Log ball count for debugging (only log once per frame to avoid spam)
      if (ballMeshes.length !== INNER_BALLS_COUNT && state.clock.elapsedTime % 2 < 0.1) {
        console.warn(`[BingoBallMachine3D] ⚠️ Expected ${INNER_BALLS_COUNT} balls, found ${ballMeshes.length} ball meshes. Total children: ${innerBallsRef.current.children.length}`);
        console.log('[BingoBallMachine3D] Children breakdown:', {
          total: innerBallsRef.current.children.length,
          agitatorGroup: innerBallsRef.current.children[0]?.type,
          ballMeshes: ballMeshes.length,
          childrenTypes: innerBallsRef.current.children.map((c, i) => ({ index: i, type: c.type, isMesh: c instanceof THREE.Mesh }))
        });
      }
      
      // Log animation state periodically (once per second, only when state changes)
      const logKey = `${spinning}-${spinPhase}`;
      if (spinning && !innerBallsRef.current.userData.lastLogKey) {
        innerBallsRef.current.userData.lastLogKey = logKey;
        console.log(`[BingoBallMachine3D] 🎬 Animating ${ballMeshes.length} balls, spinning: ${spinning}, phase: ${spinPhase}`);
      } else if (innerBallsRef.current.userData.lastLogKey !== logKey) {
        innerBallsRef.current.userData.lastLogKey = logKey;
        console.log(`[BingoBallMachine3D] 🎬 Animating ${ballMeshes.length} balls, spinning: ${spinning}, phase: ${spinPhase}`);
      }
      
      // Ensure we have velocities for all balls
      while (ballVelsRef.current.length < ballMeshes.length) {
        ballVelsRef.current.push(new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ));
      }
      
      // Animate ALL balls
      ballMeshes.forEach((obj: THREE.Mesh, ballIndex: number) => {
        // Ensure velocity exists for this ball
        if (!ballVelsRef.current[ballIndex]) {
          ballVelsRef.current[ballIndex] = new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
          );
        }
        
        const vel = ballVelsRef.current[ballIndex];
          
          // ALL BALLS GET ANIMATED - velocity is guaranteed to exist from above checks
          if (spinning) {
            // Vector from center to ball
            tmpVec.current.copy(obj.position).sub(center);
            
            if (spinPhase === 'fast') {
              // MIXING FAST: Balls move around within the ENTIRETY of the globe
              // During ramp-up (0-400ms), balls gradually lift; after ramp, full mixing
              
              // Calculate ramp-up progress for gradual ball lifting
              const elapsed = spinStartTimeRef.current !== null 
                ? state.clock.elapsedTime - spinStartTimeRef.current 
                : 0;
              const rampDuration = 0.4; // 400ms ramp-up
              const rampProgress = Math.min(1, elapsed / rampDuration);
              const easedRamp = rampProgress * rampProgress; // Quadratic ease-in
              
              // Swirl direction around a slightly-tilted axis per-ball.
              // This prevents the balls from forming a perfect horizontal "ring" row.
              const axis = new THREE.Vector3(
                Math.sin(ballIndex * 1.37) * 0.25,
                1.0,
                Math.cos(ballIndex * 1.91) * 0.25
              ).normalize();
              const swirl = new THREE.Vector3().copy(axis).cross(tmpVec.current);
              if (swirl.length() > 0.001) swirl.normalize();
              
              // Strong swirl + upward "wall climb" lift for full-globe mixing.
              // Key realism hack: as balls get flung outward, they also climb up the dome.
              const maxR = 1.05;
              const horizontalDist = Math.sqrt(tmpVec.current.x * tmpVec.current.x + tmpVec.current.z * tmpVec.current.z);
              const wallFactor = Math.min(1, horizontalDist / maxR); // 0 center -> 1 near walls

              const swirlStrength = 3.2 * easedRamp; // stronger swirl once ramped
              const gravity = 0.08; // less gravity during fast mixing
              const baseLift = 0.85; // lifts balls into the globe
              const wallClimbLift = 0.9 * wallFactor; // extra lift near walls (climb effect)
              const t = state.clock.elapsedTime;

              // Deterministic 3D turbulence (no randomness per frame, but looks random)
              // This breaks "perfect rows" and makes uplift more chaotic.
              const noiseX = Math.sin(t * 2.3 + ballIndex * 1.7) * 0.35 + Math.sin(t * 5.1 + ballIndex * 0.9) * 0.15;
              const noiseY = Math.sin(t * 2.0 + ballIndex * 2.1) * 0.25 + Math.cos(t * 4.3 + ballIndex * 1.3) * 0.12;
              const noiseZ = Math.cos(t * 2.6 + ballIndex * 1.2) * 0.35 + Math.sin(t * 4.7 + ballIndex * 1.1) * 0.15;
              const turbulenceStrength = 0.75 * easedRamp;
              const verticalNoise = noiseY * 0.08; // tiny extra vertical wobble
              
              const desired = swirl.multiplyScalar(swirlStrength);
              desired.y += (baseLift + wallClimbLift + verticalNoise) * easedRamp;
              desired.y -= gravity;

              // Add 3D turbulence and a tiny radial "thump" so balls don't orbit in a neat band
              desired.x += noiseX * turbulenceStrength;
              desired.y += noiseY * (turbulenceStrength * 0.6);
              desired.z += noiseZ * turbulenceStrength;
              
              vel.lerp(desired, 0.12); // Fast response
              vel.multiplyScalar(0.93); // Damping
              
              // Apply velocity to position
              obj.position.addScaledVector(vel, delta);
              
              // Soft wall constraint inside sphere - allow full globe movement
              // Recompute after movement so constraint matches new position
              tmpVec.current.copy(obj.position).sub(center);
              const dist = tmpVec.current.length();
              if (dist > maxR) {
                const dir = tmpVec.current.normalize();
                // Nudge inward + damp velocity so balls don't "tunnel" through glass
                obj.position.copy(center).addScaledVector(dir, maxR);
                vel.addScaledVector(dir, -1.5);
                vel.multiplyScalar(0.85);
              }
              
            } else if (spinPhase === 'slow') {
              // MIXING SLOW: Balls move around slowly at the BOTTOM of the globe
              // Gravity pulls them down, but they still swirl horizontally
              
              // Target Y position (bottom of globe, above hub/spokes)
              const targetY = -0.2; // Bottom area
              
              // Real gravity (so you see a clear "drop" after fast mix)
              // + a spring pull toward the bottom pile so it settles nicely.
              const gravity = 2.2;
              vel.y -= gravity * delta;
              const gravityPull = (targetY - obj.position.y) * 3.5; // stronger pull down
              vel.y += gravityPull * delta;
              
              // Horizontal swirl at bottom (circular motion around center)
              const horizontalDist = Math.sqrt(tmpVec.current.x ** 2 + tmpVec.current.z ** 2);
              if (horizontalDist > 0.001) {
                // Swirl direction (tangent to circle)
                const swirlX = -tmpVec.current.z / horizontalDist;
                const swirlZ = tmpVec.current.x / horizontalDist;
                const swirlStrength = 0.6; // Slow horizontal movement
                
                vel.x += swirlX * swirlStrength * delta;
                vel.z += swirlZ * swirlStrength * delta;
              }
              
              // Damping for slower, more controlled motion
              // NOTE: don't lerp to zero (that cancels the downward fall)
              vel.multiplyScalar(0.94);
              
              // Apply velocity to position
              obj.position.addScaledVector(vel, delta);
              
              // Constrain to bottom area: keep Y near bottom, keep horizontal position within bounds
              if (obj.position.y < targetY) {
                obj.position.y = targetY;
                vel.y *= 0.3; // Dampen bounce
              }
              
              // Keep horizontal movement within reasonable bounds at bottom
              const maxHorizontalDist = 0.8; // Max radius at bottom
              const horizontalDist2 = Math.sqrt(obj.position.x ** 2 + obj.position.z ** 2);
              if (horizontalDist2 > maxHorizontalDist) {
                const scale = maxHorizontalDist / horizontalDist2;
                obj.position.x *= scale;
                obj.position.z *= scale;
                // Redirect velocity inward
                const inwardX = -obj.position.x / maxHorizontalDist;
                const inwardZ = -obj.position.z / maxHorizontalDist;
                vel.x += inwardX * 0.5;
                vel.z += inwardZ * 0.5;
              }

              // Keep balls inside the globe even in slow phase (prevents "disappearing")
              tmpVec.current.copy(obj.position).sub(center);
              const dist = tmpVec.current.length();
              const maxR = 1.05;
              if (dist > maxR) {
                const dir = tmpVec.current.normalize();
                obj.position.copy(center).addScaledVector(dir, maxR);
                vel.addScaledVector(dir, -1.0);
                vel.multiplyScalar(0.85);
              }
            }
          } else {
            // NOT SPINNING: Gravity + pile at bottom (no teleporting)
            const targetY = -0.2; // Bottom of the drum
            
            // Gravity down
            vel.y -= 1.2 * delta; // Gravity constant
            
            // Damping (friction)
            vel.multiplyScalar(0.92);
            
            // Apply velocity
            obj.position.addScaledVector(vel, delta);
            
            // Ground collision - bounce slightly when hitting bottom
            if (obj.position.y < targetY) {
              obj.position.y = targetY;
              // Invert and dampen Y velocity
              vel.y = Math.abs(vel.y) * 0.25;
            }
            
            // Strong damping when near bottom (friction on ground)
            if (Math.abs(obj.position.y - targetY) < 0.05) {
              obj.position.x *= 0.985; // Slow lateral drift
              obj.position.z *= 0.985;
              vel.x *= 0.9; // Additional velocity damping
              vel.z *= 0.9;
            }

            // Keep balls inside the globe when idle too (prevents drifting out and vanishing)
            tmpVec.current.copy(obj.position).sub(center);
            const dist = tmpVec.current.length();
            const maxR = 1.05;
            if (dist > maxR) {
              const dir = tmpVec.current.normalize();
              obj.position.copy(center).addScaledVector(dir, maxR);
              // Dampen velocity strongly when clamped during idle
              vel.addScaledVector(dir, -0.8);
              vel.multiplyScalar(0.75);
            }
          }
      });
    }
  });

  return (
    <group>
      {/* Transparent Light Blue Glass Drum Sphere - realistic glass material */}
      <mesh ref={drumRef} position={[0, 1.4, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshPhysicalMaterial
          color="#87ceeb"
          transparent={true}
          opacity={0.25}
          roughness={0.05}
          metalness={0.0}
          transmission={0.9}
          thickness={0.6}
          ior={1.35}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      
      {/* Central Hub with Spokes - light brown, positioned at top of central shaft inside drum */}
      <group ref={innerBallsRef} position={[0, 0.6, 0]}>
        {/* Agitator group - rotates when spinning */}
        <group ref={agitatorRef}>
          {/* Central hub - sits on top of central shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.4, 16]} />
            <meshStandardMaterial color="#d2b48c" />
          </mesh>
          
          {/* Four spokes in cross pattern - extending from hub center, limited to stay within drum */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <mesh key={`spoke-${i}`} rotation={[0, angle, 0]} castShadow>
              <boxGeometry args={[0.05, 0.05, 1.0]} />
              <meshStandardMaterial color="#d2b48c" />
            </mesh>
          ))}
        </group>
      
        {/* Inner Balls - varied bright colors, will swirl within dome during spinning */}
        {Array.from({ length: INNER_BALLS_COUNT }).map((_, i) => {
          const p = ballInitialPositionsRef.current[i] ?? [0, -0.2, 0];
          const x = p[0];
          const y = p[1];
          const z = p[2];

          // Vary ball colors: red, yellow, green, blue
          const colors = ['#ef4444', '#fbbf24', '#22c55e', '#3b82f6', '#f97316', '#a855f7'];
          const ballColor = colors[i % colors.length];

          return (
            <mesh key={i} position={[x, y, z]} castShadow frustumCulled={false}>
              <sphereGeometry args={[0.12, 20, 20]} />
              <meshStandardMaterial
                color={ballColor}
                metalness={0.2}
                roughness={0.4}
              />
            </mesh>
          );
        })}
      </group>
      
    </group>
  );
}

export function BallInTransit({ ballValue, progress }: { ballValue: string; progress: number }) {
  const ballRef = useRef<THREE.Mesh>(null);
  
  // Animate from tube (below dome) to landing tray with realistic physics
  useFrame((state, delta) => {
    if (ballRef.current) {
      const startY = 0.2; // Start from tube position (below dome, above base)
      const endY = -0.45; // Landing tray below display panel
      const startZ = 0; // Behind the display panel
      const endZ = 0.65; // In the landing tray (in front of base)
      
      // Smoothstep easing (ease-in-out)
      const t = progress * progress * (3 - 2 * progress);
      
      const currentY = startY + (endY - startY) * t;
      const currentZ = startZ + (endZ - startZ) * t;
      
      ballRef.current.position.y = currentY;
      ballRef.current.position.z = currentZ;
      
      // Constant scale (no UI pop effect)
      ballRef.current.scale.setScalar(1);
      
      // Rotate ball as it travels (realistic rolling)
      ballRef.current.rotation.y += 8 * delta;
      ballRef.current.rotation.x += 6 * delta;
      
      // Add slight bounce when landing in tray (last 20% of progress)
      if (progress > 0.8) {
        const landingPhase = (progress - 0.8) / 0.2;
        const bounce = Math.sin(landingPhase * Math.PI * 3) * 0.02 * (1 - landingPhase);
        ballRef.current.position.y += bounce;
      }
    }
  });

  return (
      <mesh ref={ballRef} position={[0, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#3b82f6"
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
  );
}

export function DisplayBall({ ballValue, revealing }: { ballValue: string | null; revealing: boolean }) {
  const ballRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (ballRef.current && revealing) {
      const scale = 1 + Math.sin(Date.now() * 0.01) * 0.05;
      ballRef.current.scale.setScalar(scale);
    }
  });

  if (!ballValue) return null;

  return (
    <group position={[0, -0.45, 0.65]}>
      <mesh ref={ballRef} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial
          color="#3b82f6"
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

export function MachineBase() {
  return (
    <group>
      {/* Light Blue Rectangular Base - receives shadows */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[1.8, 0.6, 1.2]} />
        <meshStandardMaterial
          color="#87ceeb"
          metalness={0.1}
          roughness={0.5}
        />
      </mesh>
      
      {/* Dark blue display panel slot on front */}
      <mesh position={[0, -0.35, 0.61]} receiveShadow>
        <boxGeometry args={[0.4, 0.2, 0.05]} />
        <meshStandardMaterial color="#4682b4" />
      </mesh>
      
      {/* Landing tray for display ball - positioned below display panel and in front of base */}
      <group position={[0, -0.48, 0.65]}>
        {/* Tray base - shallow cylinder */}
        <mesh receiveShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.03, 32]} />
          <meshStandardMaterial color="#5a9bd4" metalness={0.2} roughness={0.6} />
        </mesh>
      </group>
      
      {/* Red Crank Handle - golden yellow arm with red handle */}
      <group position={[1.0, -0.3, 0]}>
        {/* Golden yellow L-shaped arm */}
        <mesh rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.25, 0.04, 0.04]} />
          <meshStandardMaterial color="#ffd700" />
        </mesh>
        {/* Red cylindrical handle */}
        <mesh position={[0.15, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 16]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
      
      {/* Central Shaft - extends from base into drum, agitator sits on top */}
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 0.6, 16]} />
        <meshStandardMaterial
          color="#87ceeb"
          metalness={0.1}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

export function Scene({ 
  spinning, 
  spinPhase, 
  ballInTransit, 
  transitProgress,
  displayBall, 
  revealing 
}: {
  spinning: boolean;
  spinPhase: 'fast' | 'slow' | null;
  ballInTransit: string | null;
  transitProgress: number;
  displayBall: string | null;
  revealing: boolean;
}) {
  return (
    <>
      {/* Realistic lighting with shadows for depth */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
      <directionalLight position={[-4, 2, -4]} intensity={0.8} />
      {/* Rim light behind camera */}
      <pointLight position={[0, 0, -3]} intensity={0.4} color="#ffffff" />
      
      <MachineBase />
      <Drum spinning={spinning} spinPhase={spinPhase} />
      
      {ballInTransit && (
        <BallInTransit ballValue={ballInTransit} progress={transitProgress} />
      )}
      
      <DisplayBall ballValue={displayBall} revealing={revealing} />
    </>
  );
}

