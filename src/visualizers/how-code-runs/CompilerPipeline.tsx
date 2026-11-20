import type { ReactNode } from 'react';
import { alpha, C } from '../core/colors';
import { StepControls } from '../core/StepControls';
import { useStepper } from '../core/useStepper';

/** One stage of the compiler, shown as a step. */
interface Stage {
  name: string;
  short: string;
  caption: ReactNode;
  body: ReactNode;
}

const TOKENS = [
  { text: 'let', kind: 'keyword', color: C.violet },
  { text: 'total', kind: 'identifier', color: C.accent },
  { text: '=', kind: 'operator', color: C.warn },
  { text: '5', kind: 'number', color: C.active },
  { text: '+', kind: 'operator', color: C.warn },
  { text: '3', kind: 'number', color: C.active },
  { text: ';', kind: 'punctuation', color: C.muted },
];

const ASSEMBLY = [
  { op: 'LOAD', args: 'R1, 5', note: 'put 5 into register R1' },
  { op: 'LOAD', args: 'R2, 3', note: 'put 3 into register R2' },
  { op: 'ADD', args: 'R3, R1, R2', note: 'R3 ← R1 + R2' },
  { op: 'STORE', args: 'R3, [0x10]', note: "save R3 to memory address 0x10 (that's `total`)" },
];

const MACHINE = [
  { fields: ['0001', '0001', '0000', '0101'], asm: 'LOAD R1, 5' },
  { fields: ['0001', '0010', '0000', '0011'], asm: 'LOAD R2, 3' },
  { fields: ['0010', '0011', '0001', '0010'], asm: 'ADD R3, R1, R2' },
  { fields: ['0011', '0011', '0001', '0000'], asm: 'STORE R3, [0x10]' },
];
/** Colour per field of an instruction: opcode, destination, then two source/value fields. */
const FIELD_COLORS = [C.pink, C.accent, C.active, C.active];

function Code({ children }: { children: ReactNode }) {
  return (
    <pre
      className="viz-mono"
      style={{
        margin: 0,
        padding: 14,
        borderRadius: 10,
        background: C.bg,
        border: `1px solid ${C.border}`,
        fontSize: 14,
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  );
}

/** The syntax tree (AST) for `let total = 5 + 3`. */
function SyntaxTree() {
  const node = (x: number, y: number, text: string, color: string, w = 120) => (
    <g>
      <rect
        x={x - w / 2}
        y={y - 16}
        width={w}
        height={32}
        rx={8}
        style={{ fill: C.bg, stroke: color }}
        strokeWidth={1.5}
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={13} style={{ fill: color }}>
        {text}
      </text>
    </g>
  );
  const edge = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1 + 16} x2={x2} y2={y2 - 16} style={{ stroke: C.border }} strokeWidth={2} />
  );
  return (
    <svg
      viewBox="0 0 460 230"
      role="img"
      aria-label="Syntax tree: declaration of total equal to 5 plus 3"
    >
      {edge(230, 30, 120, 105)}
      {edge(230, 30, 330, 105)}
      {edge(330, 105, 260, 190)}
      {edge(330, 105, 400, 190)}
      {node(230, 30, 'declare variable', C.violet, 150)}
      {node(120, 105, 'name: total', C.accent)}
      {node(330, 105, 'add  (+)', C.warn)}
      {node(260, 190, '5', C.active, 60)}
      {node(400, 190, '3', C.active, 60)}
    </svg>
  );
}

const STAGES: Stage[] = [
  {
    name: 'Source code',
    short: 'Source',
    caption: (
      <>
        You write <strong>source code</strong>. To the computer, right now it&rsquo;s just a string
        of characters, no different from a shopping list.
      </>
    ),
    body: (
      <Code>
        <span style={{ color: C.violet }}>let</span> <span style={{ color: C.accent }}>total</span>{' '}
        = <span style={{ color: C.active }}>5</span> + <span style={{ color: C.active }}>3</span>;
      </Code>
    ),
  },
  {
    name: '1. Lexing (tokenizing)',
    short: 'Lex',
    caption: (
      <>
        The <strong>lexer</strong> scans the characters and groups them into <strong>tokens</strong>
        , the &ldquo;words&rdquo; of the language, each labelled with its kind. Spaces are thrown
        away.
      </>
    ),
    body: (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {TOKENS.map((t, i) => (
          <div
            key={i}
            className="viz-fade"
            style={{ animationDelay: `${i * 90}ms`, textAlign: 'center' }}
          >
            <div
              className="viz-mono"
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: `1.5px solid ${t.color}`,
                color: t.color,
                background: alpha(t.color, 8),
                fontSize: 16,
              }}
            >
              {t.text}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{t.kind}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: '2. Parsing',
    short: 'Parse',
    caption: (
      <>
        The <strong>parser</strong> checks the grammar and arranges the tokens into a tree called an{' '}
        <strong>AST</strong> (Abstract Syntax Tree). The tree shows the meaning: &ldquo;declare{' '}
        <em>total</em> and give it the result of adding 5 and 3&rdquo;.
      </>
    ),
    body: <SyntaxTree />,
  },
  {
    name: '3. Checking',
    short: 'Check',
    caption: (
      <>
        <strong>Semantic analysis</strong> asks whether the code makes sense. Is <em>total</em>{' '}
        declared only once? Are 5 and 3 numbers that can be added? If not, this is where you get
        errors like <em>&ldquo;x is not defined&rdquo;</em> or type errors.
      </>
    ),
    body: (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {['`total` is a new name ✓', '`5` and `3` are numbers ✓', '`+` works on two numbers ✓'].map(
          (t, i) => (
            <li
              key={i}
              className="viz-fade viz-mono"
              style={{
                animationDelay: `${i * 150}ms`,
                padding: '8px 12px',
                borderRadius: 8,
                background: alpha(C.ok, 10),
                border: `1px solid ${alpha(C.ok, 40)}`,
                color: C.ok,
              }}
            >
              {t}
            </li>
          ),
        )}
      </ul>
    ),
  },
  {
    name: '4. Optimizing',
    short: 'Optimize',
    caption: (
      <>
        The <strong>optimizer</strong> looks for shortcuts. A real compiler notices that{' '}
        <em>5 + 3</em> never changes and just writes <em>8</em> (this is called{' '}
        <strong>constant folding</strong>). In this article we pretend it doesn&rsquo;t, so we can
        watch the CPU do the addition.
      </>
    ),
    body: (
      <div style={{ display: 'grid', gap: 10 }}>
        <Code>
          <span style={{ color: C.muted }}>before:</span> total = 5 + 3
        </Code>
        <Code>
          <span style={{ color: C.muted }}>after: </span> total ={' '}
          <span style={{ color: C.ok }}>8</span>
          {'   '}
          <span style={{ color: C.muted }}>// computed at compile time</span>
        </Code>
      </div>
    ),
  },
  {
    name: '5. Code generation',
    short: 'Codegen',
    caption: (
      <>
        <strong>Code generation</strong> turns the tree into <strong>assembly</strong>: tiny steps
        the CPU can actually do. &ldquo;Variables&rdquo; become <strong>registers</strong>{' '}
        (super-fast slots inside the CPU) and <strong>memory addresses</strong>.
      </>
    ),
    body: (
      <Code>
        {ASSEMBLY.map((line, i) => (
          <div
            key={i}
            className="viz-fade"
            style={{ animationDelay: `${i * 120}ms`, whiteSpace: 'pre' }}
          >
            <span style={{ color: C.pink, display: 'inline-block', width: 60 }}>{line.op}</span>
            <span style={{ color: C.text, display: 'inline-block', width: 120 }}>{line.args}</span>
            <span style={{ color: C.muted }}>; {line.note}</span>
          </div>
        ))}
      </Code>
    ),
  },
  {
    name: '6. Assembling',
    short: 'Assemble',
    caption: (
      <>
        The <strong>assembler</strong> encodes each instruction as a fixed pattern of bits. The
        first 4 bits are the <strong>opcode</strong> (what to do), and the rest say{' '}
        <strong>which registers or numbers</strong> to use. This is <strong>machine code</strong>.
      </>
    ),
    body: (
      <div>
        <Code>
          {MACHINE.map((ins, i) => (
            <div
              key={i}
              className="viz-fade"
              style={{ animationDelay: `${i * 120}ms`, whiteSpace: 'pre' }}
            >
              {ins.fields.map((f, j) => (
                <span key={j} style={{ color: FIELD_COLORS[j], marginRight: 10 }}>
                  {f}
                </span>
              ))}
              <span style={{ color: C.muted }}> ← {ins.asm}</span>
            </div>
          ))}
        </Code>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            marginTop: 8,
            fontSize: 12,
            color: C.muted,
          }}
        >
          <span>
            <span style={{ color: C.pink }}>■</span> opcode
          </span>
          <span>
            <span style={{ color: C.accent }}>■</span> destination register
          </span>
          <span>
            <span style={{ color: C.active }}>■</span> sources / value
          </span>
        </div>
      </div>
    ),
  },
  {
    name: '7. Ready to run',
    short: 'Run',
    caption: (
      <>
        The bits are saved in an <strong>executable</strong> file (<em>.exe</em> on Windows, an ELF
        file on Linux). When you run it, the operating system copies them into <strong>RAM</strong>{' '}
        and points the CPU at the first instruction. Now the hardware takes over.
      </>
    ),
    body: (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 6,
        }}
      >
        {MACHINE.map((ins, i) => (
          <div
            key={i}
            className="viz-fade"
            style={{
              animationDelay: `${i * 120}ms`,
              padding: 10,
              borderRadius: 8,
              background: C.bg,
              border: `1px solid ${C.border}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: C.muted }}>RAM address {i}</div>
            <div
              className="viz-mono"
              style={{ fontSize: 12, color: C.active, wordBreak: 'break-all' }}
            >
              {ins.fields.join('')}
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function CompilerPipeline() {
  const s = useStepper(STAGES.length, 3200);
  const stage = STAGES[s.index];

  return (
    <div className="viz not-prose">
      <p className="viz-title">Inside a compiler: from text to bits</p>
      <p className="viz-sub">Press play, or click a stage to jump to it.</p>

      {/* Stage tabs: done = mint tint, current = solid mint, upcoming = plain */}
      <div
        style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6, marginBottom: 14 }}
      >
        {STAGES.map((st, i) => {
          const done = i < s.index;
          const current = i === s.index;
          return (
            <button
              type="button"
              key={st.short}
              onClick={() => s.seek(i)}
              className="viz-btn"
              aria-current={current ? 'step' : undefined}
              style={{
                flex: '1 0 auto',
                fontSize: 12,
                padding: '6px 10px',
                background: current ? C.active : done ? alpha(C.active, 12) : C.surface,
                color: current ? C.bg : done ? C.active : C.muted,
                borderColor: current || done ? C.active : C.border,
                fontWeight: current ? 700 : 500,
              }}
            >
              {done && '✓ '}
              {st.short}
            </button>
          );
        })}
      </div>

      <div className="viz-fade" key={s.index} style={{ minHeight: 230 }}>
        <p style={{ margin: '0 0 .7rem', fontWeight: 600 }}>{stage.name}</p>
        {stage.body}
      </div>

      <div className="viz-caption">{stage.caption}</div>
      <StepControls s={s} />
    </div>
  );
}
