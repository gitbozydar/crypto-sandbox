// Funkcja zamieniająca błąd logowania na komunikat po polsku.
export const authErrorMessage = (error: { status?: number; message?: string }, fallback: string) =>
  error.status === 429 ? "Za dużo prób. Odczekaj chwilę i spróbuj ponownie." : (error.message ?? fallback);
