import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('renders the product name as the page heading', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toBe('Boas Férias');
  });
});
