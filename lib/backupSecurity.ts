/**
 * Helper Keamanan Dinamis Backup Database
 * Menghasilkan & memvalidasi password dinamis harian berbasis kalender WIB (Asia/Jakarta).
 * Format: DDMMYYYY (misal: 19102026 untuk 19 Oktober 2026)
 */

export function getDailyBackupPassword(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  return `${day}${month}${year}`;
}

export function verifyDailyBackupPassword(inputPassword?: string | null): boolean {
  if (!inputPassword) return false;
  const expectedPassword = getDailyBackupPassword();
  return inputPassword.trim() === expectedPassword;
}
