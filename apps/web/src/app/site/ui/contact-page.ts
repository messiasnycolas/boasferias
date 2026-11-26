import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { ContentPage } from './content-page';
import { CONTACT_EMAIL, setPageMeta } from './page-meta';

@Component({
  selector: 'app-contact-page',
  imports: [ContentPage],
  template: `
    <app-content-page>
      <article class="card">
        <h1 class="card-head">Contato</h1>
        <div class="card-body">
          <p class="lead">
            Encontrou um feriado errado, uma regra que não bate ou tem uma sugestão? Escreva para
            <a [href]="'mailto:' + email">{{ email }}</a>.
          </p>
          <p>
            Para corrigir um feriado, diga a cidade ou o estado, a data e, se puder, a lei que cria
            o feriado. Lemos todas as mensagens.
          </p>
          <p class="fine">
            O Boas Férias não dá orientação jurídica individual. Para casos específicos, procure o
            RH da sua empresa, o sindicato ou um advogado.
          </p>
        </div>
      </article>
    </app-content-page>
  `,
  styleUrl: './article.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  protected readonly email = CONTACT_EMAIL;

  constructor() {
    setPageMeta(inject(DOCUMENT), {
      title: 'Contato | Boas Férias',
      description:
        'Fale com o Boas Férias: correções de feriados, dúvidas sobre a calculadora e sugestões.',
      path: '/contato',
    });
  }
}
