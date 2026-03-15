/**
 * Worker thread that renders SVG→PNG off the main thread.
 * The main thread stays free to handle keyboard input instantly.
 */
import { parentPort } from 'node:worker_threads';
import { Resvg } from '@resvg/resvg-js';

parentPort?.on('message', (msg: { id: number; svg: string }) => {
  try {
    const resvg = new Resvg(msg.svg);
    const pngData = resvg.render().asPng();
    const png = Buffer.from(pngData);
    // Transfer the buffer (zero-copy) back to main thread
    parentPort?.postMessage({ id: msg.id, png }, [png.buffer as ArrayBuffer]);
  } catch (err) {
    parentPort?.postMessage({ id: msg.id, png: null, error: String(err) });
  }
});
