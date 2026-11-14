import { SuggestInput, SuggestResult, suggestPlans } from '../application/suggest-plans';

/** Runs the planner off the main thread; only the latest request resolves. */
export class PlannerClient {
  private readonly worker =
    typeof Worker === 'undefined'
      ? null
      : new Worker(new URL('./planner.worker', import.meta.url), { type: 'module' });
  private latest = 0;
  private resolve: ((result: SuggestResult) => void) | null = null;

  constructor() {
    this.worker?.addEventListener('message', ({ data }) => {
      if (data.id === this.latest) this.resolve?.(data.result);
    });
  }

  run(input: SuggestInput): Promise<SuggestResult> {
    const id = ++this.latest;
    if (!this.worker) return Promise.resolve(suggestPlans(input));
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.worker?.postMessage({ id, input });
    });
  }

  stop(): void {
    this.worker?.terminate();
  }
}
