import { formatNumber, formatCoins, formatRate } from '../src/utils/formatNumber';

describe('formatNumber', () => {
  it('formats small numbers as integers', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(1)).toBe('1');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(42.7)).toBe('42');
  });

  it('formats thousands as K', () => {
    expect(formatNumber(1_000)).toBe('1K');
    expect(formatNumber(1_500)).toBe('1.5K');
    expect(formatNumber(25_300)).toBe('25.3K');
    expect(formatNumber(999_900)).toBe('999.9K');
  });

  it('formats millions as M', () => {
    expect(formatNumber(1_000_000)).toBe('1M');
    expect(formatNumber(3_200_000)).toBe('3.2M');
    expect(formatNumber(999_000_000)).toBe('999M');
  });

  it('formats billions as B', () => {
    expect(formatNumber(1_000_000_000)).toBe('1B');
    expect(formatNumber(7_500_000_000)).toBe('7.5B');
  });

  it('formats trillions as T', () => {
    expect(formatNumber(1_000_000_000_000)).toBe('1T');
    expect(formatNumber(2_300_000_000_000)).toBe('2.3T');
  });
});

describe('formatCoins', () => {
  it('prepends coin emoji', () => {
    expect(formatCoins(500)).toBe('🪙 500');
    expect(formatCoins(1_500)).toBe('🪙 1.5K');
  });
});

describe('formatRate', () => {
  it('appends /sec suffix', () => {
    expect(formatRate(3)).toBe('3/sec');
    expect(formatRate(1_200)).toBe('1.2K/sec');
  });
});
