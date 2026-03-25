export const formatNumber = (num: number): string => {
  if (num < 1_000) return Math.floor(num).toString();
  if (num < 1_000_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (num < 1_000_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num < 1_000_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '') + 'T';
};

export const formatCoins = (num: number): string => `🪙 ${formatNumber(num)}`;

export const formatRate = (rate: number): string => `${formatNumber(rate)}/sec`;
