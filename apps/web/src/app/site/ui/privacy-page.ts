import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { ContentPage } from './content-page';
import { CONTACT_EMAIL, setPageMeta } from './page-meta';

export const PRIVACY_UPDATED = '25/11/2026';

@Component({
  selector: 'app-privacy-page',
  imports: [ContentPage],
  template: `
    <app-content-page>
      <article class="card">
        <h1 class="card-head">Política de privacidade</h1>
        <div class="card-body">
          <p class="lead">
            O Boas Férias não pede cadastro. O cálculo é feito no seu navegador, e o que você
            informa na calculadora não é enviado para nenhum servidor.
          </p>
          <p>
            A única exceção é a lista de feriados: quando você escolhe um estado ou uma cidade, o
            navegador baixa o arquivo de feriados daquele lugar, como baixa qualquer página do site.
          </p>

          <h2>O que fica no seu aparelho</h2>
          <p>
            O estado e a cidade que você escolhe ficam guardados no armazenamento local do seu
            navegador, só para a calculadora já abrir com eles da próxima vez. Esses dados não saem
            do seu aparelho. Para apagá-los, limpe os dados do site nas configurações do navegador.
          </p>

          <h2>Hospedagem</h2>
          <p>
            O site é hospedado no Firebase Hosting, do Google. Como em qualquer site, o servidor
            recebe dados técnicos da conexão, como o endereço IP e o tipo de navegador, para
            entregar as páginas e proteger o serviço.
          </p>

          <h2>Anúncios</h2>
          <p>
            Quando o site exibir anúncios do Google AdSense, o Google e seus parceiros poderão usar
            cookies para mostrar anúncios com base nas suas visitas a este e a outros sites. Antes
            disso, vamos pedir o seu consentimento. Saiba
            <a href="https://policies.google.com/technologies/partner-sites" rel="noopener"
              >como o Google usa as informações de sites que usam os serviços dele</a
            >. Você pode desativar anúncios personalizados nas
            <a href="https://adssettings.google.com" rel="noopener">configurações de anúncios</a>
            do Google.
          </p>

          <h2>Seus direitos</h2>
          <p>
            Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir confirmação de
            que tratamos dados seus, acesso, correção e exclusão. O responsável pelo site é a
            Messias Software. Escreva para <a [href]="'mailto:' + email">{{ email }}</a>.
          </p>

          <p class="fine">Atualizado em {{ updated }}.</p>
        </div>
      </article>
    </app-content-page>
  `,
  styleUrl: './article.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPage {
  protected readonly email = CONTACT_EMAIL;
  protected readonly updated = PRIVACY_UPDATED;

  constructor() {
    setPageMeta(inject(DOCUMENT), {
      title: 'Política de privacidade | Boas Férias',
      description:
        'O que o Boas Férias guarda (só no seu navegador), hospedagem, anúncios do Google e seus direitos pela LGPD.',
      path: '/privacidade',
    });
  }
}
