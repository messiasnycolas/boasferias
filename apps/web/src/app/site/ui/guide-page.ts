import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ContentPage } from './content-page';
import { GUIDE_LINKS } from './guide-links';
import { GUIDES_UPDATED, guideBySlug, textParts } from './guides';
import { setPageMeta } from './page-meta';

@Component({
  selector: 'app-guide-page',
  imports: [ContentPage, RouterLink],
  templateUrl: './guide-page.html',
  styleUrl: './article.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidePage {
  private readonly slug: string = inject(ActivatedRoute).snapshot.data['slug'];
  protected readonly guide = guideBySlug(this.slug);
  protected readonly sections = this.guide.sections.map(({ heading, text }) => ({
    heading,
    parts: textParts(text),
  }));
  protected readonly others = GUIDE_LINKS.filter((g) => g.slug !== this.guide.slug);
  protected readonly updated = GUIDES_UPDATED;

  constructor() {
    setPageMeta(inject(DOCUMENT), {
      title: this.guide.title,
      description: this.guide.description,
      path: `/guias/${this.guide.slug}`,
      faqs: this.guide.faqs,
    });
  }
}
