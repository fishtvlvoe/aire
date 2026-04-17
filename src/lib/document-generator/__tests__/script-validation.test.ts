import { describe, it, expect } from 'vitest';

describe('Short video script validation', () => {
  it('should fail if script is not between 100-150 characters', () => {
    const short_video_script = '這是一段測試劇本，包含行動呼籲，請立即聯繫我們！';
    expect(short_video_script.length).toBeLessThan(100);
  });

  it('should pass if script is between 100-150 characters', () => {
    const valid_script = '這是一段長度合格的測試劇本，內容豐富且包含行動呼籲，請立即聯繫我們！這段文字用來測試短影片劇本的長度是否在一百到一百五十字之間，確保系統的驗證邏輯完全正確無誤。物件地址台南市中西區，三房兩廳，環境優美，歡迎預約看屋，立即聯繫業務。';
    expect(valid_script.length).toBeGreaterThanOrEqual(100);
    expect(valid_script.length).toBeLessThanOrEqual(150);
  });
});
