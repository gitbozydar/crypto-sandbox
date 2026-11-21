// Next.js wywołuje register() raz, przy starcie serwera. Uruchamiamy tu proces w tle,
// który wykonuje zlecenia warunkowe (stop-loss, take-profit…) i automatyczne kupowanie.
export const register = async () => {
  // Tylko w środowisku Node.js (nie Edge) i nie podczas budowania aplikacji (next build).
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { startScheduler } = await import("./lib/jobs/scheduler");
  startScheduler();
};
