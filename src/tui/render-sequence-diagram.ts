import blessed from 'blessed';
import type { SequenceDiagram, UserSelection } from '../types.js';
import { colorForIndex } from './theme.js';

const ACTOR_W = 16;
const ACTOR_H = 3;
const MSG_H = 2;
const ACTOR_GAP = 4;

export function renderSequenceDiagram(
  screen: blessed.Widgets.Screen,
  viz: SequenceDiagram,
): { widget: blessed.Widgets.BlessedElement; getSelection: () => UserSelection | null } {
  let focusedMsg = 0;
  const actorPositions = new Map<string, number>(); // actor id -> center x

  const colorNames: Record<string, string> = {
    purple: 'magenta', teal: 'cyan', coral: 'red', pink: 'magenta',
    gray: 'white', blue: 'blue', green: 'green', amber: 'yellow', red: 'red',
  };

  const container = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%-1',
    label: ` ${viz.title} `,
    border: { type: 'line' },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '▐', style: { fg: 'cyan' } },
    keys: true,
    mouse: true,
    style: { border: { fg: 'cyan' }, label: { fg: 'white', bold: true } },
  });

  // Position actors across the top
  const totalActorW = ACTOR_W + ACTOR_GAP;
  for (let i = 0; i < viz.actors.length; i++) {
    const actor = viz.actors[i];
    const x = 2 + i * totalActorW;
    const centerX = x + Math.floor(ACTOR_W / 2);
    actorPositions.set(actor.id, centerX);

    const ramp = actor.color || colorForIndex(i);
    const color = colorNames[ramp] || 'cyan';

    // Actor box at top
    blessed.box({
      parent: container,
      top: 0,
      left: x,
      width: ACTOR_W,
      height: ACTOR_H,
      content: `\n${actor.label}`,
      align: 'center',
      border: { type: 'line' },
      style: { border: { fg: color }, fg: 'white', bold: true },
    });
  }

  // Draw lifelines
  const diagramH = ACTOR_H + viz.messages.length * MSG_H + 4;
  for (const actor of viz.actors) {
    const cx = actorPositions.get(actor.id)!;
    for (let y = ACTOR_H; y < diagramH; y++) {
      blessed.box({
        parent: container,
        top: y,
        left: cx,
        width: 1,
        height: 1,
        content: '│',
        style: { fg: 'gray' },
      });
    }
  }

  // Draw messages
  const msgBoxes: blessed.Widgets.BoxElement[] = [];
  for (let i = 0; i < viz.messages.length; i++) {
    const msg = viz.messages[i];
    const fromX = actorPositions.get(msg.from);
    const toX = actorPositions.get(msg.to);
    if (fromX === undefined || toX === undefined) continue;

    const y = ACTOR_H + 1 + i * MSG_H;
    const isFocused = i === focusedMsg;
    const ramp = msg.color || colorForIndex(i);
    const color = isFocused ? 'yellow' : (colorNames[ramp] || 'white');
    const isDashed = msg.style === 'dashed';

    const leftX = Math.min(fromX, toX) + 1;
    const rightX = Math.max(fromX, toX) - 1;
    const arrowW = rightX - leftX + 1;
    const goesRight = toX > fromX;

    if (fromX === toX) {
      // Self message
      const selfBox = blessed.box({
        parent: container,
        top: y,
        left: fromX + 1,
        width: 6,
        height: 2,
        content: '╭──╮\n╰─▶╯',
        style: { fg: color },
      });
      msgBoxes.push(selfBox);
    } else {
      // Arrow line
      const lineChar = isDashed ? '╌' : '─';
      const arrow = goesRight ? '▶' : '◀';
      let content: string;
      if (goesRight) {
        content = lineChar.repeat(Math.max(0, arrowW - 1)) + arrow;
      } else {
        content = arrow + lineChar.repeat(Math.max(0, arrowW - 1));
      }

      const arrowBox = blessed.box({
        parent: container,
        top: y + 1,
        left: leftX,
        width: arrowW,
        height: 1,
        content,
        style: { fg: color },
      });
      msgBoxes.push(arrowBox);
    }

    // Message label above arrow
    const labelX = Math.min(fromX, toX) + 1;
    blessed.box({
      parent: container,
      top: y,
      left: labelX,
      width: msg.label.length + 2,
      height: 1,
      content: ` ${msg.label}`,
      style: { fg: isFocused ? 'yellow' : 'white', bold: isFocused },
    });
  }

  const indicator = blessed.box({
    parent: container,
    bottom: 0,
    left: 1,
    width: '100%-4',
    height: 1,
    content: formatIndicator(0),
    style: { fg: 'yellow' },
  });

  function formatIndicator(idx: number): string {
    const msg = viz.messages[idx];
    if (!msg) return '';
    const fromActor = viz.actors.find(a => a.id === msg.from)?.label || msg.from;
    const toActor = viz.actors.find(a => a.id === msg.to)?.label || msg.to;
    const style = msg.style === 'dashed' ? ' (async)' : '';
    return `▶ [${idx + 1}/${viz.messages.length}] ${fromActor} → ${toActor}: ${msg.label}${style}`;
  }

  function updateFocus() {
    // Re-color arrows
    for (let i = 0; i < msgBoxes.length; i++) {
      const msg = viz.messages[i];
      const ramp = msg.color || colorForIndex(i);
      msgBoxes[i].style.fg = i === focusedMsg ? 'yellow' : (colorNames[ramp] || 'white');
    }
    indicator.setContent(formatIndicator(focusedMsg));
    // Scroll to focused message
    container.scrollTo(ACTOR_H + 1 + focusedMsg * MSG_H);
    screen.render();
  }

  screen.key(['down', 'j'], () => {
    if (focusedMsg < viz.messages.length - 1) { focusedMsg++; updateFocus(); }
  });
  screen.key(['up', 'k'], () => {
    if (focusedMsg > 0) { focusedMsg--; updateFocus(); }
  });
  screen.key(['right', 'l'], () => {
    // Jump to next message involving the same destination actor
    const curTo = viz.messages[focusedMsg]?.to;
    for (let i = focusedMsg + 1; i < viz.messages.length; i++) {
      if (viz.messages[i].from === curTo || viz.messages[i].to === curTo) {
        focusedMsg = i; updateFocus(); break;
      }
    }
  });
  screen.key(['left', 'h'], () => {
    const curFrom = viz.messages[focusedMsg]?.from;
    for (let i = focusedMsg - 1; i >= 0; i--) {
      if (viz.messages[i].from === curFrom || viz.messages[i].to === curFrom) {
        focusedMsg = i; updateFocus(); break;
      }
    }
  });

  return {
    widget: container,
    getSelection: () => {
      const msg = viz.messages[focusedMsg];
      if (!msg) return null;
      const fromActor = viz.actors.find(a => a.id === msg.from)?.label || msg.from;
      const toActor = viz.actors.find(a => a.id === msg.to)?.label || msg.to;
      return {
        type: 'message',
        id: `${msg.from}->${msg.to}`,
        label: msg.label,
        description: msg.description || `${fromActor} → ${toActor}: ${msg.label}`,
        index: focusedMsg,
      };
    },
  };
}
