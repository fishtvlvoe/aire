'use client'

import Link from 'next/link'

export type StepperStep = 1 | 2 | 3 | 4 | 5
export type StepperItemState = {
  step: StepperStep
  state: 'green' | 'blue' | 'gray'
  clickable: boolean
}

export type ListingStatus =
  | 'draft'
  | 'field-visit-complete'
  | 'ready-for-generation'
  | 'documents-ready'
  | null

const STATUS_TO_STEP: Record<Exclude<ListingStatus, null>, 2 | 3 | 4 | 5> = {
  draft: 2,
  'field-visit-complete': 3,
  'ready-for-generation': 4,
  'documents-ready': 5,
}

// 純函式：只負責把 currentStep + listingStatus 轉成「五格狀態」
export function getStepperItemStates(
  currentStep: StepperStep,
  listingStatus: ListingStatus,
): StepperItemState[] {
  const statusStep = listingStatus === null ? null : STATUS_TO_STEP[listingStatus]

  const result: StepperItemState[] = []

  for (
    let step = 1 as StepperStep;
    step <= 5;
    step = (step + 1) as StepperStep
  ) {
    const state: StepperItemState['state'] =
      step === currentStep
        ? 'blue'
        : listingStatus !== null && statusStep !== null && step < statusStep
          ? 'green'
          : 'gray'

    // Decision：
    // - 綠格：代表已走過，可回看 → clickable=true（但格1例外）
    // - 藍格：代表本頁 → 依設計可點（導頁/聚焦） → clickable=true
    // - 灰格：不可前往 → clickable=false
    let clickable = state !== 'gray'

    // 格1特殊：listing 已存在（listingStatus !== null）時，可視為已完成但不可點
    if (step === 1 && listingStatus !== null) {
      clickable = false
    }

    result.push({ step, state, clickable })
  }

  return result
}

type StepperProps = {
  currentStep: StepperStep
  listingStatus: ListingStatus
  listingId: number | null
}

// 步驟名稱對照表
const STEP_NAMES: Record<StepperStep, string> = {
  1: '選類型',
  2: '現勘',
  3: '補件',
  4: '產生中',
  5: '文件輸出',
}

// 根據步驟和 listingId 取得跳轉路徑
function getStepHref(step: StepperStep, listingId: number | null): string {
  switch (step) {
    case 1:
      return '/listings/new'
    case 2:
      return listingId ? `/listings/${listingId}/fill` : '/listings/new'
    case 3:
      return listingId ? `/listings/${listingId}/supplementary` : '/listings/new'
    case 4:
      return listingId ? `/listings/${listingId}/generating` : '/listings/new'
    case 5:
      return listingId ? `/listings/${listingId}/documents` : '/listings/new'
    default:
      return '/listings/new'
  }
}

// 元件本體（目前以最小可用為主）；狀態計算交由 getStepperItemStates
export default function Stepper({ currentStep, listingStatus, listingId }: StepperProps) {
  const items = getStepperItemStates(currentStep, listingStatus)

  return (
    <nav aria-label="流程步驟" className="flex items-center justify-center">
      {items.map((item, index) => {
        // 根據狀態決定顏色樣式
        const colorClass =
          item.state === 'green'
            ? 'bg-emerald-500 text-white'
            : item.state === 'blue'
              ? 'bg-[#1B3A6B] text-white'
              : 'bg-gray-200 text-gray-400'

        const stepHref = getStepHref(item.step, listingId)
        
        // 格1 特殊處理：只有 listingId 為 null 時才可點
        const isStep1Clickable = item.step === 1 && listingId === null
        const actualClickable = item.step === 1 ? isStep1Clickable : item.clickable

        const stepElement = (
          <div className="flex flex-col items-center">
            {/* 圓形步驟格 */}
            <div
              data-testid={`stepper-item-${item.step}`}
              aria-disabled={actualClickable ? undefined : 'true'}
              className={[
                'w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg',
                colorClass,
                actualClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed',
              ].join(' ')}
            >
              {item.step}
            </div>
            {/* 步驟名稱 */}
            <span className="text-xs text-gray-600 mt-2">
              {STEP_NAMES[item.step]}
            </span>
          </div>
        )

        return (
          <div key={item.step} className="flex items-center">
            {/* 步驟格子 */}
            {actualClickable ? (
              <Link href={stepHref}>
                {stepElement}
              </Link>
            ) : (
              stepElement
            )}
            
            {/* 箭頭分隔符（最後一個不加） */}
            {index < items.length - 1 && (
              <span aria-hidden="true" className="text-gray-400 mx-4 text-2xl">
                ›
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
