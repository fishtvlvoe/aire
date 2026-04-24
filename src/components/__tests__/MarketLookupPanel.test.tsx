/**
 * MarketLookupPanel 元件測試
 *
 * 涵蓋範圍：
 *  (a) 四個外部連結按鈕（591 實價登錄 / 591 待售 / 信義房屋 / 樂屋網）的 URL 正確性與 target="_blank"
 *  (b) textarea 字元上限（500 字元）驗證
 *  (c) 附件上傳的 size / count / format 驗證錯誤訊息
 *  (d) 法律邊界文案出現於頁面
 *
 * 測試策略：
 *  - 使用真實的 url-builder + region-mapping，傳入已知可對應的地址（台北市信義區）
 *  - 上傳驗證直接觸發 input change event，透過 userEvent 模擬 File 物件
 *  - fetch 全部 mock 為成功回應，避免網路請求干擾測試
 */

import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import MarketLookupPanel from '../MarketLookupPanel'
import type { AttachmentMeta } from '@/lib/db'

// ──────────────────────────────────────────────────
// 測試輔助常數
// ──────────────────────────────────────────────────

/** 台北市信義區地址，region-mapping 有完整對應 */
const TEST_ADDRESS = '台北市信義區忠孝東路五段100號'
const LISTING_ID = 42

/** 預設的空初始值（常規啟動狀態） */
const DEFAULT_PROPS = {
  listingId: LISTING_ID,
  address: TEST_ADDRESS,
  initialMarketSummary: null,
  initialAttachments: [] as AttachmentMeta[],
}

/** 建立假 File 物件的工廠函式 */
function makeFile(name: string, type: string, sizeBytes: number): File {
  // File API 無法直接指定 size，透過 Blob 間接達成
  const blob = new Blob([new Uint8Array(sizeBytes)], { type })
  return new File([blob], name, { type })
}

// ──────────────────────────────────────────────────
// fetch Mock + DOM cleanup（每個測試獨立）
// ──────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        attachment: {
          id: `att-${Date.now()}`, // 唯一 id 避免 React key 警告
          listingId: LISTING_ID,
          type: 'market_research',
          filename: 'test.jpg',
          url: '/uploads/test.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          createdAt: new Date().toISOString(),
        } satisfies AttachmentMeta,
      }),
    }),
  )
})

afterEach(() => {
  // 清理 DOM，防止不同測試的 render 互相汙染
  cleanup()
  vi.restoreAllMocks()
})

// ──────────────────────────────────────────────────
// (a) 外部連結按鈕
// ──────────────────────────────────────────────────

describe('外部連結按鈕', () => {
  it('應渲染四個外部連結按鈕（591 實價 / 591 待售 / 信義房屋 / 樂屋網）', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    // 用 data-platform 屬性定位，與 ExternalLinkButton 實作對應
    expect(document.querySelector('[data-platform="591-price"]')).toBeInTheDocument()
    expect(document.querySelector('[data-platform="591-buy"]')).toBeInTheDocument()
    expect(document.querySelector('[data-platform="sinyi"]')).toBeInTheDocument()
    expect(document.querySelector('[data-platform="rakuya"]')).toBeInTheDocument()
  })

  it('四個按鈕全部帶 target="_blank"（在新分頁開啟）', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const platforms = ['591-price', '591-buy', 'sinyi', 'rakuya']
    for (const platform of platforms) {
      const link = document.querySelector(`[data-platform="${platform}"]`)
      expect(link, `[data-platform="${platform}"] 應存在`).toBeInTheDocument()
      expect(link, `[data-platform="${platform}"] 應有 target="_blank"`).toHaveAttribute(
        'target',
        '_blank',
      )
    }
  })

  it('四個按鈕全部帶 rel="noopener noreferrer"（防止標籤頁劫持）', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const platforms = ['591-price', '591-buy', 'sinyi', 'rakuya']
    for (const platform of platforms) {
      const link = document.querySelector(`[data-platform="${platform}"]`)
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('591 實價登錄按鈕 URL 指向 price.591.com.tw', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const link = document.querySelector('[data-platform="591-price"]')
    expect(link).toHaveAttribute('href', expect.stringContaining('price.591.com.tw'))
  })

  it('591 待售物件按鈕 URL 指向 buy.591.com.tw', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const link = document.querySelector('[data-platform="591-buy"]')
    expect(link).toHaveAttribute('href', expect.stringContaining('buy.591.com.tw'))
  })

  it('信義房屋按鈕 URL 指向 sinyi.com.tw', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const link = document.querySelector('[data-platform="sinyi"]')
    expect(link).toHaveAttribute('href', expect.stringContaining('sinyi.com.tw'))
  })

  it('樂屋網按鈕 URL 指向 rakuya.com.tw', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const link = document.querySelector('[data-platform="rakuya"]')
    expect(link).toHaveAttribute('href', expect.stringContaining('rakuya.com.tw'))
  })

  it('地址無法解析縣市時（address=null）不渲染外連按鈕，改顯示提示文字', () => {
    // parseAddress(null) → {} → city undefined → externalLinks = []
    render(<MarketLookupPanel {...DEFAULT_PROPS} address={null} />)

    // 四個平臺按鈕都不應出現
    expect(document.querySelector('[data-platform="591-price"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-platform="591-buy"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-platform="sinyi"]')).not.toBeInTheDocument()
    expect(document.querySelector('[data-platform="rakuya"]')).not.toBeInTheDocument()

    // 取而代之的提示文字
    expect(screen.getByText(/先在「委託前」階段填寫地址/)).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────
// (b) textarea 字元上限驗證
// ──────────────────────────────────────────────────

describe('textarea 字元上限（500 字元）', () => {
  it('textarea 帶有 maxLength=500 HTML 屬性', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const textarea = screen.getByRole('textbox', { name: /周邊行情摘要/ })
    expect(textarea).toHaveAttribute('maxLength', '500')
  })

  it('初始計數顯示 0 / 500', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    // React 將 {summary.length} / {MARKET_SUMMARY_MAX} 渲染為分散的 text node，
    // 使用 custom text matcher 跨越 text node 邊界比對
    const counter = screen.getByText(
      (_content, element) =>
        element?.tagName.toLowerCase() === 'span' &&
        (element.textContent ?? '').replace(/\s/g, '') === '0/500',
    )
    expect(counter).toBeInTheDocument()
  })

  it('輸入文字後計數正確更新', async () => {
    const user = userEvent.setup()
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const textarea = screen.getByRole('textbox', { name: /周邊行情摘要/ })
    await user.type(textarea, '台北')

    // 兩個中文字 = 2 字元（TextEncoder length）
    const counter = screen.getByText(
      (_content, element) =>
        element?.tagName.toLowerCase() === 'span' &&
        (element.textContent ?? '').replace(/\s/g, '') === '2/500',
    )
    expect(counter).toBeInTheDocument()
  })

  it('initialMarketSummary 有值時計數從既有字數開始', () => {
    const existing = '已有摘要內容' // 6 個中文字，String.length = 6
    render(<MarketLookupPanel {...DEFAULT_PROPS} initialMarketSummary={existing} />)

    const counter = screen.getByText(
      (_content, element) =>
        element?.tagName.toLowerCase() === 'span' &&
        (element.textContent ?? '').replace(/\s/g, '') === '6/500',
    )
    expect(counter).toBeInTheDocument()
  })

  it('貼上超過 500 字的文字後，textarea value 長度不超過 500', async () => {
    const user = userEvent.setup()
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const textarea = screen.getByRole('textbox', { name: /周邊行情摘要/ })
    // 產生 501 字的字串
    const longText = 'A'.repeat(501)
    await user.click(textarea)
    await user.paste(longText)

    // onChange 內部做 slice(0, 500)，故值最多 500 字
    expect((textarea as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(500)
  })
})

// ──────────────────────────────────────────────────
// (c) 附件上傳驗證
// ──────────────────────────────────────────────────

describe('附件上傳驗證', () => {
  it('上傳不支援格式（例如 .gif）時顯示格式錯誤訊息', async () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const input = document.getElementById('market-attachment-input') as HTMLInputElement
    const gifFile = makeFile('screenshot.gif', 'image/gif', 1024)

    // 使用 fireEvent 直接觸發 onChange，繞過 userEvent 的 accept 屬性過濾
    // （userEvent v14 upload 預設尊重 accept，不接受不符格式的檔案）
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: Object.assign([gifFile], { item: (i: number) => [gifFile][i] }),
    })
    fireEvent.change(input)

    // 格式驗證錯誤：「檔名：僅接受 jpg / png / pdf」
    await waitFor(() => {
      expect(screen.getByText(/僅接受 jpg \/ png \/ pdf/)).toBeInTheDocument()
    })
  })

  it('上傳超過 5MB 的檔案時顯示大小超限錯誤訊息', async () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const input = document.getElementById('market-attachment-input') as HTMLInputElement
    // 6MB（> 5 * 1024 * 1024 = 5,242,880 bytes）
    const bigFile = makeFile('big.jpg', 'image/jpeg', 6 * 1024 * 1024)

    Object.defineProperty(input, 'files', {
      configurable: true,
      value: Object.assign([bigFile], { item: (i: number) => [bigFile][i] }),
    })
    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText(/超過 5MB/)).toBeInTheDocument()
    })
  })

  it('已達 10 個附件上限時，上傳 input 應被 disabled', () => {
    // 預先填滿 10 個附件
    const fullAttachments: AttachmentMeta[] = Array.from({ length: 10 }, (_, i) => ({
      id: `att-${i}`,
      listingId: LISTING_ID,
      type: 'market_research',
      filename: `file-${i}.jpg`,
      url: `/uploads/file-${i}.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      createdAt: new Date().toISOString(),
    }))

    render(<MarketLookupPanel {...DEFAULT_PROPS} initialAttachments={fullAttachments} />)

    const input = document.getElementById('market-attachment-input') as HTMLInputElement
    expect(input).toBeDisabled()
  })

  it('已達 10 個附件，嘗試再上傳時顯示上限錯誤訊息', async () => {
    // 已有 10 個附件（達到上限），直接從 initialAttachments 填滿
    // handleUpload 在進入 for loop 前第一行就檢查 attachments.length >= ATTACHMENTS_MAX
    const tenAttachments: AttachmentMeta[] = Array.from({ length: 10 }, (_, i) => ({
      id: `att-existing-${i}`,
      listingId: LISTING_ID,
      type: 'market_research',
      filename: `file-${i}.jpg`,
      url: `/uploads/file-${i}.jpg`,
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      createdAt: new Date().toISOString(),
    }))

    render(<MarketLookupPanel {...DEFAULT_PROPS} initialAttachments={tenAttachments} />)

    const input = document.getElementById('market-attachment-input') as HTMLInputElement
    // input 雖然被 disabled，但仍可用 fireEvent 直接觸發 change 繞過 disabled
    const extraFile = makeFile('extra.jpg', 'image/jpeg', 1024)
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: Object.assign([extraFile], { item: (i: number) => [extraFile][i] }),
    })

    // 先暫時移除 disabled 再觸發（fireEvent 不受 disabled 影響，但 onChange 仍需執行）
    input.removeAttribute('disabled')
    fireEvent.change(input)

    await waitFor(() => {
      expect(screen.getByText(/最多 10 個周邊行情附件/)).toBeInTheDocument()
    })
  })

  it('上傳有效 jpg 檔案（格式正確、大小合法）時不顯示任何錯誤', async () => {
    const user = userEvent.setup()
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    const input = document.getElementById('market-attachment-input') as HTMLInputElement
    const validFile = makeFile('screenshot.jpg', 'image/jpeg', 512 * 1024) // 512 KB

    // 有效格式（image/jpeg）可以使用 userEvent.upload()，accept 屬性會接受
    await user.upload(input, validFile)

    await waitFor(() => {
      // 上傳成功後無錯誤文字
      expect(screen.queryByText(/僅接受 jpg \/ png \/ pdf/)).not.toBeInTheDocument()
      expect(screen.queryByText(/超過 5MB/)).not.toBeInTheDocument()
      expect(screen.queryByText(/最多 10 個周邊行情附件/)).not.toBeInTheDocument()
    })
  })
})

// ──────────────────────────────────────────────────
// (d) 法律邊界文案
// ──────────────────────────────────────────────────

describe('法律邊界文案', () => {
  it('頁面應顯示「以下按鈕將在新分頁開啟外部網站」聲明', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    expect(screen.getByText(/以下按鈕將在新分頁開啟外部網站/)).toBeInTheDocument()
  })

  it('法律文案應包含「本系統不會自動讀取或儲存第三方平臺內容」', () => {
    render(<MarketLookupPanel {...DEFAULT_PROPS} />)

    expect(screen.getByText(/本系統不會自動讀取或儲存第三方平臺內容/)).toBeInTheDocument()
  })
})
