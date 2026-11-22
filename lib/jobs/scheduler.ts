import { runJobs } from "./run-jobs";

const INTERVAL_MS = 15_000;

const state = globalThis as typeof globalThis & { jobsTimer?: NodeJS.Timeout; jobsRunning?: boolean };

// Funkcja uruchamiająca proces w tle co 15 sekund.
export const startScheduler = () => {
  if (state.jobsTimer) return;
  state.jobsTimer = setInterval(async () => {
    if (state.jobsRunning) return;
    state.jobsRunning = true;
    try {
      const { orders, recurring } = await runJobs();
      if (orders || recurring) console.log(`[zlecenia] wykonano: warunkowe ${orders}, automatyczne ${recurring}`);
    } catch (e) {
      console.error("[zlecenia] błąd procesu w tle", e);
    } finally {
      state.jobsRunning = false;
    }
  }, INTERVAL_MS);
  state.jobsTimer.unref();
};
