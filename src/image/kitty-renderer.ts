import { Resvg } from '@resvg/resvg-js';

/**
 * Detect if the terminal supports Kitty graphics protocol.
 */
export function supportsKittyGraphics(): boolean {
  const termProgram = process.env.TERM_PROGRAM || '';
  const term = process.env.TERM || '';
  if (termProgram === 'ghostty') return true;
  if (termProgram === 'WezTerm') return true;
  if (term === 'xterm-kitty') return true;
  if (process.env.GHOSTTY_BIN_DIR) return true; // cmux/ghostty
  return false;
}

/**
 * Render SVG string to PNG buffer, scaled to fit the given width.
 */
export function svgToPng(svgString: string, width?: number): Buffer {
  const opts = width
    ? { fitTo: { mode: 'width' as const, value: width } }
    : {};
  const resvg = new Resvg(svgString, opts);
  return Buffer.from(resvg.render().asPng());
}

/**
 * Transmit a PNG image via Kitty graphics protocol.
 * z=-1 places the image behind text (allowing blessed overlays).
 */
export function transmitImage(
  output: NodeJS.WritableStream,
  pngBuffer: Buffer,
  options: { imageId?: number; cols?: number; rows?: number; zIndex?: number },
): void {
  const base64 = pngBuffer.toString('base64');
  const chunkSize = 4096;
  const id = options.imageId || 1;
  const z = options.zIndex ?? -1;

  // Size control: c=cols, r=rows makes the terminal scale the image
  const sizeParams = [];
  if (options.cols) sizeParams.push(`c=${options.cols}`);
  if (options.rows) sizeParams.push(`r=${options.rows}`);
  const sizeStr = sizeParams.length > 0 ? ',' + sizeParams.join(',') : '';

  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const more = i + chunkSize < base64.length ? 1 : 0;
    if (i === 0) {
      output.write(`\x1b_Gf=100,t=d,a=T,z=${z},i=${id}${sizeStr},m=${more};${chunk}\x1b\\`);
    } else {
      output.write(`\x1b_Gm=${more};${chunk}\x1b\\`);
    }
  }
}

/**
 * Delete a previously transmitted Kitty image by ID.
 */
export function deleteImage(
  output: NodeJS.WritableStream,
  imageId: number,
): void {
  output.write(`\x1b_Ga=d,d=I,i=${imageId}\x1b\\`);
}
