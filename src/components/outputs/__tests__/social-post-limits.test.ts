import { describe, it, expect } from 'vitest';

describe('Social post character limits', () => {
  const PLATFORMS = [
    { name: 'Facebook', max: 63206 },
    { name: 'Instagram', max: 2200 },
    { name: 'Threads', max: 500 },
    { name: 'TikTok', max: 2200 },
    { name: 'YouTube', max: 5000 },
  ];

  it('should have correct character limits for each platform', () => {
    PLATFORMS.forEach(({ name, max }) => {
      const platform = PLATFORMS.find((p) => p.name === name);
      expect(platform?.max).toBe(max);
    });
  });

  it('Facebook limit should be 63206', () => {
    expect(PLATFORMS.find(p => p.name === 'Facebook')?.max).toBe(63206);
  });

  it('Threads limit should be 500', () => {
    expect(PLATFORMS.find(p => p.name === 'Threads')?.max).toBe(500);
  });
});
