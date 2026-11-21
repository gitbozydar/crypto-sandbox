import { runJobs } from "./run-jobs";

const INTERVAL_MS = 15_000;

// Stan na globalThis: przy przeładowaniu kodu w trybie deweloperskim nie uruchomimy drugiego timera.
const state = globalThis as typeof globalThis & { jobsTimer?: NodeJS.Timeout; jobsRunning?: boolean };

// Uruchamia proces w tle (raz na serwer). Kolejny przebieg nie startuje, dopóki poprzedni trwa.
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
  state.jobsTimer.unref(); // timer nie trzyma procesu przy życiu (np. przy zamykaniu serwera)
};
