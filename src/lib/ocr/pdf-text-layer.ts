/**
 * pdf-text-layer.ts — PDF 文字層萃取器
 *
 * 使用 pdfjs-dist legacy build（ESM），逐頁抽取文字內容。
 * 結果包含：合併文字、是否有文字層、總頁數。
 */

// pdfjs-dist v5 為 ESM，必須使用 legacy build 的 .mjs 入口
// @ts-ignore — 型別宣告在 .d.mts，動態 import 時 TS 無法自動推斷
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api'

if (typeof window === 'undefined' && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()
}

export type TextLayerResult = {
  /** 合併後的完整文字 */
  text: string
  /** 是否包含文字層（false 表示為掃描圖片 PDF） */
  hasTextLayer: boolean
  /** PDF 總頁數 */
  pageCount: number
}

/**
 * 從 PDF Buffer 萃取文字層
 *
 * @param buffer - PDF 檔案的 Buffer
 * @returns 文字層結果
 */
export async function extractTextLayer(buffer: Buffer): Promise<TextLayerResult> {
  // pdfjs-dist 需要 Uint8Array 作為輸入
  const data = new Uint8Array(buffer)

  // 停用 worker（Node.js 環境下不需要）
  const loadingTask = getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  })

  const pdfDocument = await loadingTask.promise
  const pageCount = pdfDocument.numPages

  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDocument.getPage(pageNum)
    const textContent = await page.getTextContent()

    if (textContent.items.length === 0) {
      // 此頁沒有文字 item，跳過
      continue
    }

    // 將每個 text item 串接，item.hasEOL 時加換行
    // TextMarkedContent 沒有 str/hasEOL，用型別守衛過濾
    const isTextItem = (item: TextItem | TextMarkedContent): item is TextItem =>
      'str' in item

    const pageText = (textContent.items as Array<TextItem | TextMarkedContent>)
      .filter(isTextItem)
      .map((item) => (item.hasEOL ? item.str + '\n' : item.str))
      .join('')

    pageTexts.push(pageText)
  }

  const fullText = pageTexts.join('\n')
  const hasTextLayer = fullText.trim().length > 0

  return {
    text: fullText,
    hasTextLayer,
    pageCount,
  }
}
