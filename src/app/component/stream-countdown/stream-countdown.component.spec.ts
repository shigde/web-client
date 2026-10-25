import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {StreamCountdownComponent} from './stream-countdown.component';

describe('Local stream countdown', () => {
  it('counts down to zero and waits for the actual live status', fakeAsync(() => {
    const fixture = TestBed.createComponent(StreamCountdownComponent);
    fixture.componentRef.setInput('date', new Date(Date.now() + 2000));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="timer"]')).not.toBeNull();
    expect(fixture.componentInstance.parts[3].value).toBe('02');
    tick(1000);
    fixture.detectChanges();
    expect(fixture.componentInstance.parts[3].value).toBe('01');
    tick(1000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Waiting for stream to start');
    expect(fixture.nativeElement.querySelector('[role="timer"]')).toBeNull();
    fixture.destroy();
    tick(2000);
  }));

  it('splits days and hours and does not render invalid dates', () => {
    const fixture = TestBed.createComponent(StreamCountdownComponent);
    const component = fixture.componentInstance;
    component.now.set(0);
    component.date = new Date((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
    expect(component.parts.map(p => p.value)).toEqual(['02', '03', '04', '05']);
    fixture.componentRef.setInput('date', 'invalid');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('time')).toBeNull();
    fixture.destroy();
  });
});
