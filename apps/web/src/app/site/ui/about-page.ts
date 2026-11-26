import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPage } from './content-page';
import { CONTACT_EMAIL, setPageMeta } from './page-meta';

@Component({
  selector: 'app-about-page',
  imports: [ContentPage, RouterLink],
  template: `
    <app-content-page>
      <article class="card">
        <h1 class="card-head">Sobre o Boas Férias</h1>
        <div class="card-body">
          <p class="lead">
            O Boas Férias é um planejador de férias gratuito para quem trabalha no Brasil, com
            carteira assinada (CLT) ou como PJ. Você diz quantos dias tem, e ele mostra as datas que
            rendem mais dias de descanso.
          </p>

          <h2>Como funciona</h2>
          <p>
            A calculadora testa todas as datas possíveis no período que você escolhe e encosta as
            férias em fins de semana e feriados. Na CLT, ela segue as regras da lei: divisão em até
            3 períodos, o mínimo de 14 e de 5 dias, os dias em que as férias não podem começar e a
            venda de 1/3. Os planos são sugestões para levar à empresa, que é quem escolhe a data
            (art. 136).
          </p>
          <p>
            Tudo roda no seu navegador e não há cadastro. Quando você escolhe um estado ou uma
            cidade, o site baixa a lista de feriados de lá; nada mais do que você informa sai do seu
            aparelho.
          </p>

          <h2>De onde vêm os feriados</h2>
          <p>
            Os feriados nacionais seguem a lei federal. Os estaduais foram conferidos na lei de cada
            estado. Os municipais vêm de uma base aberta, o projeto feriados-brasil (licença MIT), e
            só os das capitais foram conferidos na lei. Se a sua cidade tiver um feriado errado ou
            faltando, você pode tirar ou adicionar dias na calculadora, e pode nos avisar.
          </p>

          <h2>Quem faz</h2>
          <p>
            O Boas Férias é feito pela Messias Software. Sugestões e correções são bem-vindas:
            escreva para <a [href]="'mailto:' + email">{{ email }}</a>.
          </p>

          <p class="fine">
            As informações do site explicam a lei de forma simples e não substituem orientação
            jurídica. Veja também a <a routerLink="/privacidade">política de privacidade</a>.
          </p>
        </div>
      </article>
    </app-content-page>
  `,
  styleUrl: './article.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPage {
  protected readonly email = CONTACT_EMAIL;

  constructor() {
    setPageMeta(inject(DOCUMENT), {
      title: 'Sobre o Boas Férias | Planejador de férias gratuito',
      description:
        'Quem faz o Boas Férias, como a calculadora escolhe as datas e de onde vêm os feriados nacionais, estaduais e municipais.',
      path: '/sobre',
    });
  }
}
