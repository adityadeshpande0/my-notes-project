/** One frame of a sorting animation. Renderers only draw this; they never run the algorithm. */
export interface SortStep {
  array: number[];
  /** Indices being compared (amber). */
  comparing?: [number, number];
  /** Indices that were just swapped (coral). */
  swapping?: [number, number];
  /** Indices from here to the end are in their final place (green). */
  sortedFrom: number;
  /** 1-based pseudocode line to highlight; 0 means none. */
  line: number;
  /** Plain-English caption for this step. */
  message: string;
}
