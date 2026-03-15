import * as fs from 'node:fs';
import * as path from 'node:path';
import { detectImageProtocol } from '../utils.js';

export async function displayImageInTerminal(
  pngBuffer: Buffer,
  fallbackPath?: string,
): Promise<string> {
  const protocol = detectImageProtocol();
  const ttyFd = fs.openSync('/dev/tty', 'w');

  try {
    switch (protocol) {
      case 'iterm2': {
        const base64 = pngBuffer.toString('base64');
        const seq = `\x1b]1337;File=inline=1;size=${pngBuffer.length};preserveAspectRatio=1:${base64}\x07`;
        fs.writeSync(ttyFd, seq);
        fs.writeSync(ttyFd, '\n');
        return 'Displayed via iTerm2 image protocol';
      }

      case 'kitty': {
        const base64 = pngBuffer.toString('base64');
        const chunkSize = 4096;
        for (let i = 0; i < base64.length; i += chunkSize) {
          const chunk = base64.slice(i, i + chunkSize);
          const more = i + chunkSize < base64.length ? 1 : 0;
          if (i === 0) {
            fs.writeSync(ttyFd, `\x1b_Gf=100,t=d,a=T,m=${more};${chunk}\x1b\\`);
          } else {
            fs.writeSync(ttyFd, `\x1b_Gm=${more};${chunk}\x1b\\`);
          }
        }
        fs.writeSync(ttyFd, '\n');
        return 'Displayed via Kitty image protocol';
      }

      case 'sixel':
      case 'none':
      default: {
        const savePath = fallbackPath || path.join(process.cwd(), 'visualization.png');
        fs.writeFileSync(savePath, pngBuffer);
        return `Image saved to: ${savePath}`;
      }
    }
  } finally {
    fs.closeSync(ttyFd);
  }
}
