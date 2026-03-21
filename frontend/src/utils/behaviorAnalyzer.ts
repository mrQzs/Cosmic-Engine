/**
 * Browser behavior analyzer for anti-spam.
 * Tracks mouse movement entropy, keystroke rhythm, and scroll behavior
 * to distinguish humans from bots.
 */

interface BehaviorData {
  mousePositions: { x: number; y: number; t: number }[];
  keyIntervals: number[];
  scrollEvents: number[];
  startTime: number;
}

let data: BehaviorData | null = null;
let listening = false;

function onMouseMove(e: MouseEvent) {
  if (!data) return;
  data.mousePositions.push({ x: e.clientX, y: e.clientY, t: Date.now() });
  // Keep last 100 samples
  if (data.mousePositions.length > 100) {
    data.mousePositions.shift();
  }
}

let lastKeyTime = 0;
function onKeyDown() {
  if (!data) return;
  const now = Date.now();
  if (lastKeyTime > 0) {
    data.keyIntervals.push(now - lastKeyTime);
    if (data.keyIntervals.length > 50) {
      data.keyIntervals.shift();
    }
  }
  lastKeyTime = now;
}

function onScroll() {
  if (!data) return;
  data.scrollEvents.push(Date.now());
  if (data.scrollEvents.length > 50) {
    data.scrollEvents.shift();
  }
}

/** Start tracking user behavior. Call once on page load or component mount. */
export function startTracking(): void {
  if (listening) return;
  data = {
    mousePositions: [],
    keyIntervals: [],
    scrollEvents: [],
    startTime: Date.now(),
  };
  listening = true;
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('keydown', onKeyDown, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
}

/** Stop tracking and clean up listeners. */
export function stopTracking(): void {
  if (!listening) return;
  listening = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('scroll', onScroll);
}

/**
 * Compute behavior score from collected data.
 * @returns score from 0 (bot-like) to 1 (human-like)
 */
export function computeBehaviorScore(): number {
  if (!data) return 0;

  let score = 0;
  const elapsed = (Date.now() - data.startTime) / 1000;

  // Factor 1: Mouse movement entropy (0-0.35)
  // Bots move in perfect straight lines or don't move at all
  if (data.mousePositions.length >= 5) {
    const angles: number[] = [];
    for (let i = 2; i < data.mousePositions.length; i++) {
      const p0 = data.mousePositions[i - 2];
      const p1 = data.mousePositions[i - 1];
      const p2 = data.mousePositions[i];
      const dx1 = p1.x - p0.x;
      const dy1 = p1.y - p0.y;
      const dx2 = p2.x - p1.x;
      const dy2 = p2.y - p1.y;
      const angle = Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1);
      angles.push(angle);
    }
    // Variance of direction changes
    const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const variance = angles.reduce((sum, a) => sum + (a - mean) * (a - mean), 0) / angles.length;
    // Humans have moderate variance; bots have near-zero
    score += Math.min(0.35, variance * 5);
  }

  // Factor 2: Keystroke rhythm variance (0-0.35)
  if (data.keyIntervals.length >= 3) {
    const mean = data.keyIntervals.reduce((a, b) => a + b, 0) / data.keyIntervals.length;
    const variance =
      data.keyIntervals.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) /
      data.keyIntervals.length;
    const cv = Math.sqrt(variance) / (mean || 1); // Coefficient of variation
    // Humans: CV ~0.3-0.8; Bots: CV ~0-0.05
    score += Math.min(0.35, cv * 0.5);
  }

  // Factor 3: Page engagement time (0-0.15)
  // Bots submit very quickly
  if (elapsed > 5) score += 0.05;
  if (elapsed > 15) score += 0.05;
  if (elapsed > 30) score += 0.05;

  // Factor 4: Scroll activity (0-0.15)
  if (data.scrollEvents.length > 2) score += 0.08;
  if (data.scrollEvents.length > 10) score += 0.07;

  return Math.min(1, score);
}
