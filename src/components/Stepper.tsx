'use client'

import Link from 'next/link'

export type StepperStep = 1 | 2 | 3 | 4
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

const STATUS_TO_STEP: Record<Exclude<ListingStatus, null>, 2 | 3 | 4> = {
  draft: 2,
  'field-visit-complete': 3,
  'ready-for-generation': 3,
  'documents-ready': 4,
}

// 純函式：只負責把 currentStep + listingStatus 轉成「四格狀態」
export function getStepperItemStates(
  currentStep: StepperStep,
  listingStatus: ListingStatus,
): StepperItemState[] {
  const statusStep = listingStatus === null ? null : STATUS_TO_STEP[listingStatus]

  const result: StepperItemState[] = []

  for (
    let step = 1 as StepperStep;
    step <= 4;
    step = (step + 1) as StepperStep
  ) {
    const state: StepperItemState['state'] =
      step === currentStep
        ? 'blue'
        : listingStatus !== null && statusStep !== null && step < statusStep
          ? 'green'
          : 'gray'

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

const STEP_NAMES: Record<StepperStep, string> = {
  1: '選類型',
  2: '現勘',
  3: '產生中',
  4: '文件輸出',
}

function getStepHref(step: StepperStep, listingId: number | null): string {
  switch (step) {
    case 1:
      return '/listings/new'
    case 2:
      return listingId ? `/listings/${listingId}/fill` : '/listings/new'
    case 3:
      return listingId ? `/listings/${listingId}/generating` : '/listings/new'
    case 4:
      return listingId ? `/listings/${listingId}/documents` : '/listings/new'
    default:
      return '/listings/new'
  }
}

export default function Stepper({ currentStep, listingStatus, listingId }: StepperProps) {
  const items = getStepperItemStates(currentStep, listingStatus)

  return (
    <nav aria-label="流程步驟" className="flex items-center justify-center">
      {items.map((item, index) => {
        const colorClass =
          item.state === 'green'
            ? 'bg-emerald-500 text-white'
            : item.state === 'blue'
              ? 'bg-[#1B3A6B] text-white'
              : 'bg-gray-200 text-gray-400'

        const stepHref = getStepHref(item.step, listingId)

        const isStep1Clickable = item.step === 1 && listingId === null
        const actualClickable = item.step === 1 ? isStep1Clickable : item.clickable

        const stepElement = (
          <div className="flex flex-col items-center">
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
            <span className="text-xs text-gray-600 mt-2">
              {STEP_NAMES[item.step]}
            </span>
          </div>
        )

        return (
          <div key={item.step} className="flex items-center">
            {actualClickable ? (
              <Link href={stepHref}>
                {stepElement}
              </Link>
            ) : (
              stepElement
            )}

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
