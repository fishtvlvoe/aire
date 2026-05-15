import { safeInvoke as baseSafeInvoke } from "./tauri-bridge";

export { NotInTauriError, isTauriEnv } from "./tauri-bridge";

type MockHandler = (args?: Record<string, unknown>) => Promise<unknown>;

const mockHandlers: Record<string, MockHandler> = {
  query_real_price: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return [
      {
        address: "台南市東區裕農路123號",
        total_price: 12800000,
        area: 32.5,
        unit_price: 393846,
        date: "2024-01-15",
        type: "大樓",
      },
      {
        address: "台南市東區裕農路456號5樓",
        total_price: 9500000,
        area: 24.8,
        unit_price: 383065,
        date: "2023-11-20",
        type: "大樓",
      },
      {
        address: "台南市東區裕農路789號3樓之2",
        total_price: 15200000,
        area: 42.1,
        unit_price: 361045,
        date: "2024-03-08",
        type: "大樓",
      },
    ];
  },
};

export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (process.env.NODE_ENV === "development" && cmd in mockHandlers) {
    return (await mockHandlers[cmd](args)) as T;
  }

  return baseSafeInvoke<T>(cmd, args);
}
