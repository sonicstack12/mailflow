// Smart email delay calculation based on email count
// Implements human-like sending patterns to avoid spam detection

interface DelayRange {
  minDelay: number; // in seconds
  maxDelay: number; // in seconds
  jitter: number;   // in seconds
}

function getDelayRangeForCount(emailCount: number): DelayRange {
  if (emailCount <= 10) {
    // Cold start / very safe: 2-7 minutes + ±30 seconds jitter
    return { minDelay: 120, maxDelay: 420, jitter: 30 };
  } else if (emailCount <= 50) {
    // Warm-up phase: 5-12 minutes + ±1 minute jitter
    return { minDelay: 300, maxDelay: 720, jitter: 60 };
  } else if (emailCount <= 100) {
    // Moderate automation: 8-18 minutes + ±2 minutes jitter
    return { minDelay: 480, maxDelay: 1080, jitter: 120 };
  } else if (emailCount <= 200) {
    // High volume: 15-30 minutes + ±3 minutes jitter
    return { minDelay: 900, maxDelay: 1800, jitter: 180 };
  } else if (emailCount <= 500) {
    // Enterprise bulk: 25-45 minutes + ±5 minutes jitter
    return { minDelay: 1500, maxDelay: 2700, jitter: 300 };
  } else {
    // Maximum safety mode (500+): 45-90 minutes + ±10 minutes jitter
    return { minDelay: 2700, maxDelay: 5400, jitter: 600 };
  }
}

export function calculateEmailDelay(emailIndex: number, totalEmails: number): number {
  const range = getDelayRangeForCount(totalEmails);
  
  // Base delay: random between min and max
  const baseDelay = Math.random() * (range.maxDelay - range.minDelay) + range.minDelay;
  
  // Jitter: random between -jitter and +jitter
  const jitter = (Math.random() * 2 - 1) * range.jitter;
  
  let delay = baseDelay + jitter;
  
  // Human pause logic: Every 15-25 emails, add extra 20-40 minute pause
  const pauseInterval = Math.floor(Math.random() * 11) + 15; // 15-25
  if (emailIndex > 0 && emailIndex % pauseInterval === 0) {
    const extraPause = Math.random() * 1200 + 1200; // 20-40 minutes in seconds
    delay += extraPause;
  }
  
  // Ensure minimum delay of 2 minutes
  return Math.max(delay, 120);
}

export function getDelayDescription(totalEmails: number): string {
  if (totalEmails <= 10) {
    return "2-7 minutes between emails (safe start)";
  } else if (totalEmails <= 50) {
    return "5-12 minutes between emails (warm-up)";
  } else if (totalEmails <= 100) {
    return "8-18 minutes between emails (moderate)";
  } else if (totalEmails <= 200) {
    return "15-30 minutes between emails (high volume)";
  } else if (totalEmails <= 500) {
    return "25-45 minutes between emails (bulk)";
  } else {
    return "45-90 minutes between emails (maximum safety)";
  }
}

export function formatDelayTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

// Constants for email limits
export const EMAIL_LIMITS = {
  FREE_DAILY_LIMIT: 250,
  PREMIUM_DAILY_LIMIT: Infinity,
} as const;
