/// <reference lib="webworker" />
import { SuggestInput, suggestPlans } from '../application/suggest-plans';

addEventListener('message', ({ data }: MessageEvent<{ id: number; input: SuggestInput }>) => {
  postMessage({ id: data.id, result: suggestPlans(data.input) });
});
