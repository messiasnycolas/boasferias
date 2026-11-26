import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from './logo';
import { SiteFooter } from './site-footer';

/** Reading pages: the sky with the name (back to the calculator), the page's card, the footer. */
@Component({
  selector: 'app-content-page',
  imports: [Logo, RouterLink, SiteFooter],
  template: `
    <header class="bar">
      <div class="bar-inner">
        <a class="brand" routerLink="/"><app-logo />Boas Férias</a>
      </div>
    </header>
    <main><ng-content /></main>
    <app-site-footer />
  `,
  styles: `
    :host {
      display: block;
      /* About 75 characters a line in the card. */
      --column: 640px;
    }
    /* The name lines up with the card's left edge. */
    .bar-inner {
      max-width: calc(var(--column) - 32px);
      margin: 0 auto;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      color: var(--ink);
      text-decoration: none;
      font-size: clamp(22px, 6vw, 28px);
      font-weight: 800;
      letter-spacing: -0.015em;
      line-height: 1.1;
    }
    main {
      max-width: var(--column);
      margin: -56px auto 0;
      padding: 0 16px 24px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPage {}
