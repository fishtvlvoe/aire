/**
 * Vitest 全域測試環境設定
 *
 * 提供 @testing-library/jest-dom 的 custom matchers（toBeInTheDocument 等），
 * 讓 DOM 斷言更具可讀性。
 */
import '@testing-library/jest-dom/vitest'
