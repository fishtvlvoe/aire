const TOSEND_API_URL = 'https://tosend.io/api/send';

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  const apiKey = process.env.TOSEND_API_KEY?.trim();
  const fromEmail = process.env.TOSEND_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) {
    console.error('toSend email env 缺少 TOSEND_API_KEY 或 TOSEND_FROM_EMAIL');
    return;
  }

  try {
    const response = await fetch(TOSEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: '密碼重設 - AI 不動產系統',
        text: `請點擊以下連結重設密碼（15 分鐘內有效）：\n\n${resetUrl}`,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('toSend API 發信失敗', response.status, text);
    }
  } catch (error) {
    console.error('toSend API 發信例外', error);
  }
}
