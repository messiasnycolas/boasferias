import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./vacation/ui/planner-page').then((m) => m.PlannerPage),
  },
];
