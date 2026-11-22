// Funkcja uruchamiająca proces w tle przy starcie serwera.
export const register = async () => {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { startScheduler } = await import("./lib/jobs/scheduler");
  startScheduler();
};
