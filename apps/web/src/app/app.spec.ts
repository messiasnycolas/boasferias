import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  it('serves the planner on the home route', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(routes[0].path).toBe('');
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
