import { useMemo } from 'react';
import { alpha, C } from '../core/colors';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';
import { PROGRAM, simulate, type Phase, type Reg } from './cpu';

/**
 * A toy CPU running our 4-instruction program with the fetch → decode →
 * execute cycle. The steps come from simulate() in cpu.ts; this file only draws them.
 */

const PHASE_COLOR: Record<Phase, string> = {
  READY: C.muted,
  FETCH: C.accent,
  DECODE: C.violet,
  EXECUTE: C.warn,
  'WRITE BACK': C.ok,
  DONE: C.ok,
};

export default function CpuCycle() {
  // useMemo: run the simulation once, not on every render.
  const steps = useMemo(() => simulate(), []);
  const s = useStepper(steps.length, 2600);
  const st = steps[s.index];
  const on = (id: string) => st.active.includes(id);
  const phaseColor = PHASE_COLOR[st.phase];

  // Small drawing helpers so the SVG below reads like a layout, not a wall of attributes.
  const box = (id: string, x: number, y: number, w: number, h: number, rx = 10) => (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      strokeWidth={on(id) ? 2 : 1.5}
      style={{
        fill: on(id) ? alpha(C.active, 10) : C.bg,
        stroke: on(id) ? C.active : C.border,
        transition: 'all .3s',
        filter: on(id) ? `drop-shadow(0 0 6px ${alpha(C.active, 55)})` : 'none',
      }}
    />
  );
  const label = (x: number, y: number, text: string) => (
    <text x={x} y={y} fontSize={11} style={{ fill: C.muted, letterSpacing: '.06em' }}>
      {text}
    </text>
  );
  const val = (
    x: number,
    y: number,
    text: string,
    size = 15,
    anchor: 'start' | 'middle' = 'start',
    color: string = C.text,
  ) => (
    <text
      x={x}
      y={y}
      fontSize={size}
      textAnchor={anchor}
      style={{ fill: color, fontFamily: 'var(--font-mono)' }}
    >
      {text}
    </text>
  );
  const regRow = (r: Reg, y: number) => {
    const v = st.regs[r];
    return (
      <g key={r}>
        {box(r.toLowerCase(), 52, y, 176, 32, 7)}
        {val(66, y + 21, r, 13, 'start', C.accent)}
        {val(
          214,
          y + 21,
          v === null ? '—' : String(v),
          16,
          'middle',
          v === null ? C.muted : C.text,
        )}
      </g>
    );
  };

  return (
    <div className="viz not-prose">
      <p className="viz-title">Watch the CPU run our program</p>
      <p className="viz-sub">
        Fetch → Decode → Execute, one instruction at a time. Glowing parts are working in this step.
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            padding: '4px 12px',
            borderRadius: 999,
            background: alpha(phaseColor, 14),
            border: `1px solid ${phaseColor}`,
            color: phaseColor,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '.06em',
          }}
        >
          {st.phase}
        </span>
        <span className="viz-chip viz-mono">clock tick {st.tick}</span>
        {st.ir && st.phase !== 'DONE' && (
          <span className="viz-chip viz-mono">running: {st.ir.asm}</span>
        )}
      </div>

      <div className="viz-scroll">
        <svg
          viewBox="0 0 720 360"
          style={{ minWidth: 560 }}
          role="img"
          aria-label={`CPU diagram, ${st.phase} phase`}
        >
          {/* CPU outline */}
          <rect
            x={20}
            y={20}
            width={460}
            height={320}
            rx={16}
            strokeWidth={1.5}
            strokeDasharray="6 6"
            style={{ fill: 'none', stroke: alpha(C.accent, 40) }}
          />
          <text x={36} y={42} fontSize={13} fontWeight={700} style={{ fill: C.accent }}>
            CPU
          </text>

          {/* Control unit */}
          {box('cu', 40, 56, 200, 92)}
          {label(52, 76, 'CONTROL UNIT')}
          <foreignObject x={50} y={84} width={182} height={60}>
            <div style={{ fontSize: 12.5, color: on('cu') ? C.active : C.text, lineHeight: 1.35 }}>
              {st.cu}
            </div>
          </foreignObject>

          {/* Program counter + instruction register */}
          {box('pc', 260, 56, 200, 40)}
          {label(272, 80, 'PROGRAM COUNTER')}
          {val(448, 82, String(st.pc), 18, 'middle')}

          {box('ir', 260, 106, 200, 42)}
          {label(272, 122, 'INSTRUCTION REG.')}
          {val(272, 140, st.ir ? st.ir.bits : '—', 11.5, 'start', st.ir ? C.text : C.muted)}

          {/* Registers */}
          <rect
            x={40}
            y={166}
            width={200}
            height={160}
            rx={10}
            style={{ fill: 'none', stroke: C.border }}
          />
          {label(52, 186, 'REGISTERS')}
          {regRow('R1', 196)}
          {regRow('R2', 238)}
          {regRow('R3', 280)}

          {/* ALU, drawn in the classic V shape */}
          <path
            d="M270 176 L330 176 L360 214 L390 176 L450 176 L420 316 L300 316 Z"
            strokeWidth={on('alu') ? 2 : 1.5}
            style={{
              fill: on('alu') ? alpha(C.warn, 14) : C.bg,
              stroke: on('alu') ? C.warn : C.border,
              transition: 'all .3s',
              filter: on('alu') ? `drop-shadow(0 0 8px ${alpha(C.warn, 55)})` : 'none',
            }}
          />
          <text
            x={360}
            y={250}
            fontSize={12}
            textAnchor="middle"
            style={{ fill: C.muted, letterSpacing: '.06em' }}
          >
            ALU
          </text>
          {val(360, 280, st.alu || 'idle', st.alu ? 17 : 12, 'middle', st.alu ? C.warn : C.muted)}

          {/* Bus between CPU and RAM. Dashes march in the direction the bits travel. */}
          <line
            x1={480}
            y1={180}
            x2={530}
            y2={180}
            className={`wire ${st.busFlow ? 'on flow' : ''}`}
            strokeWidth={6}
            style={st.busFlow === 'toCpu' ? { animationDirection: 'reverse' } : undefined}
          />
          <text x={505} y={170} fontSize={10} textAnchor="middle" style={{ fill: C.muted }}>
            BUS
          </text>

          {/* RAM */}
          <rect
            x={530}
            y={20}
            width={170}
            height={320}
            rx={16}
            strokeWidth={1.5}
            strokeDasharray="6 6"
            style={{ fill: 'none', stroke: alpha(C.active, 40) }}
          />
          <text x={546} y={42} fontSize={13} fontWeight={700} style={{ fill: C.active }}>
            RAM
          </text>
          {PROGRAM.map((p, i) => (
            <g key={i}>
              {box(`m${i}`, 542, 54 + i * 46, 146, 38, 7)}
              {val(552, 54 + i * 46 + 15, `addr ${i}`, 10, 'start', C.muted)}
              {val(552, 54 + i * 46 + 31, p.bits.replace(/ /g, ''), 11)}
              {/* The PC's bookmark: points at the next instruction */}
              {st.pc === i && st.phase !== 'DONE' && (
                <text x={692} y={54 + i * 46 + 25} fontSize={14} style={{ fill: C.accent }}>
                  ◀
                </text>
              )}
            </g>
          ))}
          <text x={615} y={252} fontSize={14} textAnchor="middle" style={{ fill: C.muted }}>
            ⋮
          </text>
          {box('m16', 542, 266, 146, 54, 7)}
          {val(552, 284, 'addr 0x10 (total)', 10, 'start', C.muted)}
          {val(
            615,
            310,
            st.total === null ? '?' : String(st.total),
            20,
            'middle',
            st.total === null ? C.muted : C.ok,
          )}
        </svg>
      </div>

      <div className="viz-caption">{st.caption}</div>
      <StepControls s={s} />
    </div>
  );
}
