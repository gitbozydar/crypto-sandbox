// Komunikat błędu z Better Auth po polsku. Limit prób (HTTP 429) ma własny komunikat,
// w pozostałych przypadkach treść z serwera albo podany tekst domyślny.
export const authErrorMessage = (error: { status?: number; message?: string }, fallback: string) =>
  error.status === 429 ? "Za dużo prób. Odczekaj chwilę i spróbuj ponownie." : (error.message ?? fallback);
