import { describe, it, expect } from 'vitest';
import { parseTranscript } from '../transcript-parser';

describe('parseTranscript — announced_land_price', () => {
  it('應從「申報地價」關鍵字提取數字，去除逗號與小數', async () => {
    const yaml = `申報地價: "10,188.0元／平方公尺"\n`;
    const result = await parseTranscript(Buffer.from(yaml), 'test.yaml');
    expect(result.additional?.announced_land_price).toBe(10188);
  });

  it('應從「當期申報地價」關鍵字提取數字', async () => {
    const yaml = `當期申報地價: "10,500.0元／平方公尺"\n`;
    const result = await parseTranscript(Buffer.from(yaml), 'test.yaml');
    expect(result.additional?.announced_land_price).toBe(10500);
  });

  it('無申報地價關鍵字時應回傳 undefined', async () => {
    const yaml = `其他欄位: "無相關資料"\n`;
    const result = await parseTranscript(Buffer.from(yaml), 'test.yaml');
    expect(result.additional?.announced_land_price).toBeUndefined();
  });
});
