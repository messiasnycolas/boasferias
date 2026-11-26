import { Routes } from '@angular/router';
import { GUIDE_LINKS } from './site/ui/guide-links';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./vacation/ui/planner-page').then((m) => m.PlannerPage),
  },
  // One route per guide: each is prerendered at its own address.
  ...GUIDE_LINKS.map(({ slug }) => ({
    path: `guias/${slug}`,
    data: { slug },
    loadComponent: () => import('./site/ui/guide-page').then((m) => m.GuidePage),
  })),
  { path: 'sobre', loadComponent: () => import('./site/ui/about-page').then((m) => m.AboutPage) },
  {
    path: 'privacidade',
    loadComponent: () => import('./site/ui/privacy-page').then((m) => m.PrivacyPage),
  },
  {
    path: 'contato',
    loadComponent: () => import('./site/ui/contact-page').then((m) => m.ContactPage),
  },
];
