// Justified-rows packer (the Flickr/Google-Photos algorithm) for Compact mode.
//
// Photos keep their true aspect ratio (no cropping) and are butted edge-to-edge
// with no gaps: we fill a row at the target height, then scale that row's height
// so the photo widths sum to the container width exactly. The last, incomplete
// row keeps its natural target height (left-aligned) rather than stretching one
// lonely photo across the whole width.

export interface PackedRow {
  /** Indices into the photos array, in order. */
  idxs: number[];
  /** Final row height in px (photo i renders at width = height * aspect[i]). */
  height: number;
}

export function packRows(
  aspects: number[],
  containerW: number,
  targetH: number,
): PackedRow[] {
  if (containerW <= 0 || targetH <= 0 || aspects.length === 0) return [];

  const rows: PackedRow[] = [];
  let row: number[] = [];
  let arSum = 0; // running sum of aspect ratios in the current row

  for (let i = 0; i < aspects.length; i++) {
    row.push(i);
    arSum += aspects[i];

    // Width this row would occupy at the target height.
    const naturalW = targetH * arSum;
    if (naturalW >= containerW) {
      // Row is full — justify: choose the height that makes the widths sum to
      // containerW exactly (gapless). height = W / Σaspect.
      rows.push({ idxs: row, height: containerW / arSum });
      row = [];
      arSum = 0;
    }
  }

  // Trailing partial row: keep the target height, left-aligned.
  if (row.length) rows.push({ idxs: row, height: targetH });

  return rows;
}
