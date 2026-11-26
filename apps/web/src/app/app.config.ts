import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Every page opens at the top, Back too: the planner comes back rebuilt, so an old offset
    // would land somewhere else.
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    // Replays clicks made on the prerendered page before the app hydrates.
    provideClientHydration(withEventReplay()),
  ],
};
