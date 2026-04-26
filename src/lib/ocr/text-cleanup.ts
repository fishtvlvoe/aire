/**
 * text-cleanup.ts — 文字清洗工具
 *
 * 用於移除 PDF 文字層常見的垃圾字元，並整理空白格式。
 */

/**
 * 移除填充字元並壓縮空白
 *
 * 規則：
 * 1. 移除所有 `*`（半形與全形星號）
 * 2. 移除全形空白 U+3000
 * 3. 連續半形空白壓縮為一個，保留換行
 * 4. 中文/數字之間的孤立 \n 移除（避免斷詞），但保留 \n\n（段落分隔）
 */
export function stripFillerChars(text: string): string {
  let result = text

  // 步驟 1：移除星號（半形 * 與全形 ＊）
  result = result.replace(/[*＊]/g, '')

  // 步驟 2：移除全形空白
  result = result.replace(/\u3000/g, '')

  // 步驟 3：連續半形空白壓縮為一個（不跨換行）
  result = result.replace(/[ \t]+/g, ' ')

  // 步驟 4：中文或數字之間的孤立 \n 移除
  // 「孤立」= 前後都是中文字符或數字，且不是 \n\n（段落）
  // 先保護 \n\n：替換為佔位符
  result = result.replace(/\n\n/g, '\x00PARA\x00')

  // 移除夾在中文/數字之間的單個 \n
  result = result.replace(/([\u4e00-\u9fa5\d])\n([\u4e00-\u9fa5\d])/g, '$1$2')

  // 還原段落分隔符
  result = result.replace(/\x00PARA\x00/g, '\n\n')

  return result
}
