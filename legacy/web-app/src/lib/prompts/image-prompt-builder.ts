export interface ImagePromptContext {
  property_type: string;
  district?: string;
  target_persona?: string;
  scene?: string; // '廚房' | '客廳' | '外觀' | '社區' 等
}

function v(x: unknown): string {
  if (x === null || x === undefined) return '待補';
  if (typeof x === 'string') return x.trim() || '待補';
  return String(x);
}

export function buildImagePrompt(context: ImagePromptContext): string {
  return [
    `[情境描述] 台灣 ${v(context.district)}，${v(context.property_type)}，場景：${v(context.scene)}。目標受眾：${v(
      context.target_persona
    )}。`,
    '[意向風格] photorealistic lifestyle, warm natural light, editorial composition, minimal clutter.',
    '[數位人] 使用「抽象生活氛圍」或「背影/手部」意象，不使用真人臉部寫實照片。',
    '[背景參考] 以城市生活感、日常動線、舒適材質為主。',
    '[技術參數] 16:9, high detail, shallow depth of field, film color grading.',
    '',
    '規則：不要真實房屋實拍照、不要空蕩室內、不要真人臉部照片。',
  ].join('\n');
}
