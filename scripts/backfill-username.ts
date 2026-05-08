import { db } from '@/lib/db';

db.prepare("UPDATE users SET username = email WHERE (username IS NULL OR username = '') AND email IS NOT NULL").run();
console.log('Backfill complete');
