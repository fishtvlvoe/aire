declare global {
  var __AIRE_ADMIN_SEEDED__: boolean | undefined;
}

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  if (globalThis.__AIRE_ADMIN_SEEDED__) {
    return;
  }

  globalThis.__AIRE_ADMIN_SEEDED__ = true;
  try {
    const { seedAdminFromEnv } = await import('@/lib/seed-admin');
    await seedAdminFromEnv();
  } catch (error) {
    console.warn('管理員帳號 seed 失敗', error);
  }
}
