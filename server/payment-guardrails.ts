type CaptchaProvider = 'hcaptcha' | 'recaptcha';

export interface PrizeSettlementBreakdown {
  grossAmount: string;
  taxAmount: string;
  gasFeeAmount: string;
  platformFeeAmount: string;
  netAmount: string;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const requestBuckets = new Map<string, { count: number; resetAt: number }>();

export function calculatePrizeSettlement(
  grossAmount: string,
  options?: { taxRate?: number; gasFeeAmount?: string; platformFeeAmount?: string }
): PrizeSettlementBreakdown {
  const gross = Number(grossAmount);
  const taxRate = options?.taxRate ?? 0.22;
  const gasFee = Number(options?.gasFeeAmount ?? '0');
  const platformFee = Number(options?.platformFeeAmount ?? '0');
  const taxAmount = gross * taxRate;
  const netAmount = Math.max(gross - taxAmount - gasFee - platformFee, 0);

  return {
    grossAmount,
    taxAmount: taxAmount.toFixed(8),
    gasFeeAmount: gasFee.toFixed(8),
    platformFeeAmount: platformFee.toFixed(8),
    netAmount: netAmount.toFixed(8),
  };
}

export function checkSimpleRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitDecision {
  const now = Date.now();
  const bucket = requestBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    requestBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  requestBuckets.set(key, bucket);
  return {
    allowed: true,
    remaining: Math.max(maxRequests - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
}

export async function verifyCaptchaToken(input: {
  provider: CaptchaProvider;
  token: string;
  remoteIp?: string;
}): Promise<boolean> {
  const secretKey =
    input.provider === 'hcaptcha'
      ? process.env.HCAPTCHA_SECRET
      : process.env.RECAPTCHA_SECRET;

  if (!secretKey || !input.token) {
    return false;
  }

  const endpoint =
    input.provider === 'hcaptcha'
      ? 'https://hcaptcha.com/siteverify'
      : 'https://www.google.com/recaptcha/api/siteverify';

  const payload = new URLSearchParams({
    secret: secretKey,
    response: input.token,
  });

  if (input.remoteIp) {
    payload.set('remoteip', input.remoteIp);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
}
