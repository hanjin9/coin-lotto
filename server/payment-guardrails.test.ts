import { describe, expect, it } from 'vitest';
import { calculatePrizeSettlement, checkSimpleRateLimit } from './payment-guardrails';

describe('payment-guardrails', () => {
  it('세금과 수수료를 반영해 실수령액을 계산한다', () => {
    const result = calculatePrizeSettlement('1000', {
      taxRate: 0.22,
      gasFeeAmount: '10',
      platformFeeAmount: '20',
    });

    expect(result.grossAmount).toBe('1000');
    expect(result.taxAmount).toBe('220.00000000');
    expect(result.netAmount).toBe('750.00000000');
  });

  it('윈도우 내 요청 수를 초과하면 제한한다', () => {
    const key = `test-${Date.now()}`;
    const first = checkSimpleRateLimit(key, 2, 60_000);
    const second = checkSimpleRateLimit(key, 2, 60_000);
    const third = checkSimpleRateLimit(key, 2, 60_000);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });
});
