"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MutableRefObject } from "react";

export type CinematicRefs = {
  camera: MutableRefObject<{ x: number; y: number; z: number }>;
  target: MutableRefObject<{ x: number; y: number; z: number }>;
  morph: MutableRefObject<{ scale: number; rotationY: number; color: string }>;
};

function CinematicCamera({ camera, target }: Pick<CinematicRefs, "camera" | "target">) {
  const ref = useRef<THREE.PerspectiveCamera>(null);

  useFrame((_, delta) => {
    const cam = ref.current;
    if (!cam) return;
    // Damped follow — GSAP writes the refs, the render loop eases toward them.
    const t = 1 - Math.exp(-delta * 4);
    cam.position.x += (camera.current.x - cam.position.x) * t;
    cam.position.y += (camera.current.y - cam.position.y) * t;
    cam.position.z += (camera.current.z - cam.position.z) * t;
    cam.lookAt(target.current.x, target.current.y, target.current.z);
  });

  return <PerspectiveCamera ref={ref} makeDefault fov={42} near={0.1} far={120} position={[0, 0.7, 8]} />;
}

function Emblem({ morph }: Pick<CinematicRefs, "morph">) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const targetColor = useMemo(() => new THREE.Color("#006f45"), []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const m = morph.current;
    targetColor.set(m.color);
    if (mat.current) mat.current.color.lerp(targetColor, 1 - Math.exp(-delta * 3));
    if (ringMat.current)
      ringMat.current.color.lerp(targetColor, 1 - Math.exp(-delta * 3));
    const s = THREE.MathUtils.lerp(g.scale.x, m.scale, 1 - Math.exp(-delta * 3));
    g.scale.setScalar(Math.max(0.001, s));
    g.rotation.y += delta * 0.25;
    g.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.7}>
      <group ref={group}>
        {/* Core — the "lifesaving" knot */}
        <mesh>
          <torusKnotGeometry args={[1, 0.32, 180, 24]} />
          <meshStandardMaterial ref={mat} color="#006f45" roughness={0.25} metalness={0.55} />
        </mesh>
        {/* Crescent ring */}
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[1.9, 0.045, 16, 128]} />
          <meshStandardMaterial
            ref={ringMat}
            color="#ed1c24"
            roughness={0.3}
            metalness={0.4}
            emissive="#ed1c24"
            emissiveIntensity={0.35}
          />
        </mesh>
      </group>
    </Float>
  );
}

function ParticleField({ morph }: Pick<CinematicRefs, "morph">) {
  const COUNT = 900;
  const ref = useRef<THREE.Points>(null);
  const targetColor = useMemo(() => new THREE.Color("#006f45"), []);

  const { positions, seeds } = useMemo(() => {
    // Deterministic seeded RNG so renders are pure (eslint react-hooks/purity).
    let s = 0x9e3779b9;
    const rand = () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 4 + rand() * 9;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      seeds[i] = rand() * Math.PI * 2;
    }
    return { positions, seeds };
  }, []);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    pts.rotation.y = state.clock.elapsedTime * 0.03;
    pts.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
    targetColor.set(morph.current.color);
    const m = pts.material as THREE.PointsMaterial;
    m.color.lerp(targetColor, 0.04);
    m.size = 0.045 + Math.sin(state.clock.elapsedTime * 1.2) * 0.008;
    // Gentle pulse on the whole field
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.015;
    pts.scale.setScalar(s);
    void seeds;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} transparent opacity={0.75} depthWrite={false} color="#006f45" />
    </points>
  );
}

export function CinematicCanvas(refs: CinematicRefs) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      aria-hidden
    >
      <color attach="background" args={["#07110d"]} />
      <fog attach="fog" args={["#07110d", 9, 22]} />
      <CinematicCamera camera={refs.camera} target={refs.target} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 7, 5]} intensity={1.6} />
      <pointLight position={[-4, 2, 4]} intensity={12} color="#ed1c24" />
      <pointLight position={[4, -1, 3]} intensity={10} color="#2e9e74" />
      <Emblem morph={refs.morph} />
      <ParticleField morph={refs.morph} />
    </Canvas>
  );
}
