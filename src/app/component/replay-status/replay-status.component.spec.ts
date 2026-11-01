import {TestBed} from '@angular/core/testing';
import {ReplayStatusComponent} from './replay-status.component';

describe('Replay failure presentation', () => {
  it('shows a useful message and keeps the technical error collapsed', async () => {
    await TestBed.configureTestingModule({imports: [ReplayStatusComponent]}).compileComponents();
    const fixture = TestBed.createComponent(ReplayStatusComponent);
    fixture.componentRef.setInput('status', 'failed');
    fixture.componentRef.setInput('error', 'Source rendition changed during recording');
    fixture.componentRef.setInput('panel', true);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector('h2')?.textContent).toBe('Recording failed');
    expect(root.querySelector('p')?.textContent).toContain('could not be completed');
    expect(root.querySelector('details')?.hasAttribute('open')).toBeFalse();
    expect(root.querySelector('pre')?.textContent).toContain('Source rendition changed');
    fixture.destroy();
  });
});
