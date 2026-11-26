import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GUIDE_LINKS } from './guide-links';

/** On the sea under every page, as wide as the page's column (`--column`). */
@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  template: `
    <footer>
      <nav aria-labelledby="footer-guides">
        <h2 id="footer-guides">Guias</h2>
        <ul>
          @for (guide of guides; track guide.slug) {
            <li>
              <a [routerLink]="'/guias/' + guide.slug">{{ guide.name }}</a>
            </li>
          }
        </ul>
      </nav>
      <nav aria-labelledby="footer-site">
        <h2 id="footer-site">Boas Férias</h2>
        <ul>
          <li><a routerLink="/">Calculadora de férias</a></li>
          <li><a routerLink="/sobre">Sobre</a></li>
          <li><a routerLink="/privacidade">Privacidade</a></li>
          <li><a routerLink="/contato">Contato</a></li>
        </ul>
      </nav>
      <p>© {{ year }} Messias Software</p>
    </footer>
  `,
  styleUrl: './site-footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly guides = GUIDE_LINKS;
  protected readonly year = new Date().getFullYear();
}
