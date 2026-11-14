// Mirrors the "smart delay" logic from the legacy Supabase edge function.

export function getDelayRangeForCount(emailCount: number): { minDelaySec: number; maxDelaySec: number; jitterSec: number } {
  if (emailCount <= 10) return { minDelaySec: 120, maxDelaySec: 420, jitterSec: 30 };
  if (emailCount <= 50) return { minDelaySec: 300, maxDelaySec: 720, jitterSec: 60 };
  if (emailCount <= 100) return { minDelaySec: 480, maxDelaySec: 1080, jitterSec: 120 };
  if (emailCount <= 200) return { minDelaySec: 900, maxDelaySec: 1800, jitterSec: 180 };
  if (emailCount <= 500) return { minDelaySec: 1500, maxDelaySec: 2700, jitterSec: 300 };
  return { minDelaySec: 2700, maxDelaySec: 5400, jitterSec: 600 };
}

export function calculateEmailDelaySec(emailIndex: number, totalEmails: number): number {
  const r = getDelayRangeForCount(totalEmails);
  const base = Math.random() * (r.maxDelaySec - r.minDelaySec) + r.minDelaySec;
  const jitter = (Math.random() * 2 - 1) * r.jitterSec;
  let delay = base + jitter;

  // Human pause logic
  const pauseInterval = Math.floor(Math.random() * 11) + 15;
  if (emailIndex > 0 && emailIndex % pauseInterval === 0) {
    const extraPause = Math.random() * 1200 + 1200;
    delay += extraPause;
  }

  return Math.max(delay, 120);
}


