/**
 * A toy CPU running our 4-instruction program with the
 * fetch → decode → execute cycle. `simulate()` returns one snapshot per step.
 * Pure TypeScript, no React: see cpu.test.ts.
 */

export type Reg = 'R1' | 'R2' | 'R3';

export type Instr =
  | { asm: string; bits: string; op: 'LOAD'; dst: Reg; val: number }
  | { asm: string; bits: string; op: 'ADD'; dst: Reg; a: Reg; b: Reg }
  | { asm: string; bits: string; op: 'STORE'; src: Reg; addr: number };

export const PROGRAM: Instr[] = [
  { asm: 'LOAD R1, 5', bits: '0001 0001 0000 0101', op: 'LOAD', dst: 'R1', val: 5 },
  { asm: 'LOAD R2, 3', bits: '0001 0010 0000 0011', op: 'LOAD', dst: 'R2', val: 3 },
  { asm: 'ADD R3, R1, R2', bits: '0010 0011 0001 0010', op: 'ADD', dst: 'R3', a: 'R1', b: 'R2' },
  { asm: 'STORE R3, [0x10]', bits: '0011 0011 0001 0000', op: 'STORE', src: 'R3', addr: 0x10 },
];

export type Phase = 'READY' | 'FETCH' | 'DECODE' | 'EXECUTE' | 'WRITE BACK' | 'DONE';

export interface CpuStep {
  phase: Phase;
  pc: number;
  ir: Instr | null;
  regs: Record<Reg, number | null>;
  /** memory[0x10], our variable `total` */
  total: number | null;
  /** what the control unit is saying */
  cu: string;
  /** what the ALU shows */
  alu: string;
  /** ids of the parts that glow in this step */
  active: string[];
  busFlow: 'toCpu' | 'toMem' | null;
  caption: string;
  tick: number;
}

export function simulate(program: Instr[] = PROGRAM): CpuStep[] {
  const steps: CpuStep[] = [];
  let pc = 0;
  let tick = 0;
  let ir: Instr | null = null;
  const regs: Record<Reg, number | null> = { R1: null, R2: null, R3: null };
  let total: number | null = null;

  const push = (s: Omit<CpuStep, 'pc' | 'ir' | 'regs' | 'total' | 'tick'>) =>
    steps.push({ ...s, pc, ir, regs: { ...regs }, total, tick: tick++ });

  push({
    phase: 'READY',
    cu: 'waiting…',
    alu: '',
    active: ['m0', 'm1', 'm2', 'm3', 'pc'],
    busFlow: null,
    caption:
      'The OS has loaded our 4 machine-code instructions into RAM (addresses 0–3) and set the Program Counter (PC) to 0. The CPU is ready.',
  });

  for (const ins of program) {
    const at = pc;

    // FETCH: the PC tells memory which address to send; the instruction travels over the bus into the IR.
    ir = ins;
    pc = pc + 1;
    push({
      phase: 'FETCH',
      cu: 'fetch next instruction',
      alu: '',
      active: ['pc', `m${at}`, 'bus', 'ir'],
      busFlow: 'toCpu',
      caption: `FETCH: the PC said "address ${at}", so RAM sends the bits ${ins.bits} over the bus into the Instruction Register (IR). The PC moves on to ${pc}.`,
    });

    // DECODE: the control unit reads the opcode bits.
    const opBits = ins.bits.slice(0, 4);
    const meaning =
      ins.op === 'LOAD'
        ? `LOAD: put ${ins.val} into ${ins.dst}`
        : ins.op === 'ADD'
          ? `ADD: ${ins.a} + ${ins.b} → ${ins.dst}`
          : `STORE: copy ${ins.src} to RAM[0x10]`;
    push({
      phase: 'DECODE',
      cu: meaning,
      alu: '',
      active: ['ir', 'cu'],
      busFlow: null,
      caption: `DECODE: the Control Unit reads the first 4 bits (${opBits}) and recognises ${ins.op}. It switches on the right circuits for the job, a bit like a railway operator setting the tracks.`,
    });

    // EXECUTE (+ WRITE BACK for ADD)
    if (ins.op === 'LOAD') {
      regs[ins.dst] = ins.val;
      push({
        phase: 'EXECUTE',
        cu: meaning,
        alu: '',
        active: ['cu', ins.dst.toLowerCase()],
        busFlow: null,
        caption: `EXECUTE: the number ${ins.val} (the last 8 bits, ${ins.bits.slice(-9).replace(' ', '')}) is copied into register ${ins.dst}.`,
      });
    } else if (ins.op === 'ADD') {
      const a = regs[ins.a] ?? 0;
      const b = regs[ins.b] ?? 0;
      push({
        phase: 'EXECUTE',
        cu: meaning,
        alu: `${a} + ${b} = ${a + b}`,
        active: ['cu', 'r1', 'r2', 'alu'],
        busFlow: null,
        caption: `EXECUTE: R1 (${a}) and R2 (${b}) are sent to the ALU (Arithmetic Logic Unit). Its adder circuit, built from logic gates, produces ${a + b}. We'll open up this adder later in the article.`,
      });
      regs[ins.dst] = a + b;
      push({
        phase: 'WRITE BACK',
        cu: meaning,
        alu: `${a} + ${b} = ${a + b}`,
        active: ['alu', 'r3'],
        busFlow: null,
        caption: `WRITE BACK: the ALU's answer, ${a + b}, is stored in register R3.`,
      });
    } else {
      total = regs[ins.src];
      push({
        phase: 'EXECUTE',
        cu: meaning,
        alu: '',
        active: ['cu', 'r3', 'bus', 'm16'],
        busFlow: 'toMem',
        caption: `EXECUTE: the value in R3 (${total}) travels over the bus to RAM address 0x10. That memory spot is our variable \`total\`.`,
      });
    }
  }

  push({
    phase: 'DONE',
    cu: 'program finished',
    alu: '',
    active: ['m16'],
    busFlow: null,
    caption: `Done! total = ${total}. In our toy CPU that took ${tick} clock ticks. A 3 GHz CPU does 3,000,000,000 ticks per second, so this would take about ${(tick / 3).toFixed(1)} billionths of a second.`,
  });
  return steps;
}
