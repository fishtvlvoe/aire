export type CodexStatus =
  | "ready"
  | "not-logged-in"
  | "quota-exceeded"
  | "error";

export interface CodexResult {
  success: boolean;
  output?: string;
  error?: string;
  status: CodexStatus;
}

export interface LlmAdapter {
  run(prompt: string, timeoutMs: number): Promise<CodexResult>;
  runVision?(imagePath: string, prompt: string, timeoutMs: number): Promise<CodexResult>;
  check(): Promise<CodexStatus>;
}
