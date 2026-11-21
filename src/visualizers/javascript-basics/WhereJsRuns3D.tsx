/*
 * The 3D version of "JavaScript's universe". This file (and three.js with it)
 * is only loaded through React.lazy in WhereJsRuns.tsx, so it never lands in
 * the site's initial bundle or even in the note's own chunk.
 */
import { useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Vector3, type Group } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useTheme } from '../../app/useTheme';
import { useInView, usePageVisible } from '../../lib/hooks';
import { PLANETS, type Planet } from './planets';

/** Read a theme colour (a CSS variable) as a value three.js understands, e.g. "#7c9cff". */
function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'white';
}

const orbitRadius = (i: number) => 3 + i * 0.95;
const orbitSpeed = (i: number) => 0.32 / (1 + i * 0.3); // outer planets go slower

interface Props {
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function WhereJsRuns3D({ selected, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef);
  const pageVisible = usePageVisible();
  // Re-render (and re-read the colours) when the site theme flips.
  const { theme } = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);
  // Where each planet is right now, written every frame by the planets and read
  // by the camera rig. We create the Map once and then only change what's *inside*
  // it, from useFrame, so updating positions never causes a React re-render.
  const [positions] = useState(() => new Map<string, Vector3>());

  // The label elements (DOM, drawn over the canvas), keyed by planet id ("sun" too).
  // LabelSync moves them every frame by writing style.transform directly.
  // The label elements (DOM, drawn over the canvas), keyed by planet id ("sun" too).
  // Like `positions`, the Map is created once and only its contents change.
  const [labels] = useState(() => new Map<string, HTMLElement>());
  const labelRef = (id: string) => (el: HTMLElement | null) => {
    if (el) labels.set(id, el);
    else labels.delete(id);
  };

  const [coarsePointer] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  // Animate continuously only while you can see it; otherwise draw on demand.
  const live = inView && pageVisible;

  return (
    <div ref={wrapRef} className="wr-canvas" data-theme-key={theme}>
      <Canvas
        frameloop={live ? 'always' : 'demand'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 7.5, 13], fov: 45 }}
        onPointerMissed={() => setHovered(null)}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[0, 0, 0]} intensity={60} decay={1.6} color={cssColor('--warn')} />
        {theme === 'dark' && (
          <Stars radius={60} depth={30} count={1200} factor={3} fade speed={0} />
        )}

        {/* The JS sun */}
        <mesh>
          <sphereGeometry args={[1.3, 48, 48]} />
          <meshBasicMaterial color={cssColor('--warn')} />
        </mesh>
        {/* A faint halo around the sun */}
        <mesh>
          <sphereGeometry args={[1.7, 48, 48]} />
          <meshBasicMaterial
            color={cssColor('--warn')}
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>

        {PLANETS.map((p, i) => (
          <group key={p.id}>
            <mesh rotation-x={-Math.PI / 2}>
              <ringGeometry args={[orbitRadius(i) - 0.012, orbitRadius(i) + 0.012, 128]} />
              <meshBasicMaterial color={cssColor('--border')} transparent opacity={0.9} />
            </mesh>
            <PlanetMesh
              planet={p}
              index={i}
              color={cssColor(p.colorVar)}
              active={selected === p.id || hovered === p.id}
              onSelect={onSelect}
              onHover={setHovered}
              positions={positions}
            />
          </group>
        ))}

        <CameraRig selected={selected} positions={positions} />
        <LabelSync labels={labels} positions={positions} />
        {/* On touch screens, dragging must scroll the page, so no orbit controls there. */}
        {!coarsePointer && (
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={7}
            maxDistance={20}
            minPolarAngle={0.25}
            maxPolarAngle={Math.PI / 2.1}
          />
        )}
      </Canvas>

      {/* Labels are plain DOM on top of the canvas: crisp text, emoji, theme colours. */}
      <div className="wr-labels" aria-hidden="true">
        <span ref={labelRef('sun')} className="wr-sun-label">
          JS
        </span>
        {PLANETS.map((p) => {
          const showName = selected === p.id || hovered === p.id;
          return (
            <span key={p.id} ref={labelRef(p.id)} className="wr-planet-label">
              <span>{p.icon}</span>
              {showName && <span className="wr-planet-name">{p.name}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Every frame, turn each 3D position into a pixel position on the canvas
 * (`project` gives -1…1 on each axis) and move its DOM label there.
 */
function LabelSync({
  labels,
  positions,
}: {
  labels: Map<string, HTMLElement>;
  positions: Map<string, Vector3>;
}) {
  const v = useRef(new Vector3());
  useFrame(({ camera, size }) => {
    for (const [id, el] of labels) {
      if (id === 'sun') v.current.set(0, 0, 0);
      else {
        const pos = positions.get(id);
        if (!pos) continue;
        v.current.copy(pos).setY(pos.y + 0.75); // just above the planet
      }
      v.current.project(camera);
      const x = ((v.current.x + 1) / 2) * size.width;
      const y = ((1 - v.current.y) / 2) * size.height;
      el.style.setProperty(
        'transform',
        `translate(${x}px, ${y}px) translate(-50%, ${id === 'sun' ? '-50%' : '-100%'})`,
      );
    }
  });
  return null;
}

function PlanetMesh({
  planet,
  index,
  color,
  active,
  onSelect,
  onHover,
  positions,
}: {
  planet: Planet;
  index: number;
  color: string;
  active: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  positions: Map<string, Vector3>;
}) {
  const ref = useRef<Group>(null);
  const angle = useRef(index * 1.05);

  // useFrame runs every frame, outside React's render. We move the planet by
  // changing the three.js object directly, which is much cheaper than state.
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    angle.current += Math.min(delta, 0.1) * orbitSpeed(index);
    const r = orbitRadius(index);
    g.position.set(Math.cos(angle.current) * r, 0, Math.sin(angle.current) * r);
    const target = active ? 1.45 : 1;
    g.scale.setScalar(g.scale.x + (target - g.scale.x) * 0.15);
    let pos = positions.get(planet.id);
    if (!pos) positions.set(planet.id, (pos = new Vector3()));
    pos.copy(g.position);
  });

  return (
    <group ref={ref}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(planet.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = '';
        }}
      >
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.55 : 0.18}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

/** Smoothly turns the camera toward the selected planet (and back to the sun). */
function CameraRig({
  selected,
  positions,
}: {
  selected: string | null;
  positions: Map<string, Vector3>;
}) {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const goal = useRef(new Vector3());
  const look = useRef(new Vector3()); // where the camera looks when there are no controls

  useFrame(({ camera }) => {
    const pos = selected ? positions.get(selected) : undefined;
    goal.current.set(0, 0, 0);
    if (pos) goal.current.copy(pos);
    if (controls) {
      controls.target.lerp(goal.current, 0.06);
      controls.update();
    } else {
      look.current.lerp(goal.current, 0.06);
      camera.lookAt(look.current);
    }
  });
  return null;
}
