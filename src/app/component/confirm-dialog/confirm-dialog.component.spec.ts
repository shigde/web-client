import {TestBed} from '@angular/core/testing';
import {ConfirmDialogComponent} from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  it('shows one modal for repeated requests and resolves confirmation', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    const result = fixture.componentInstance.confirm();
    expect(fixture.componentInstance.confirm()).toBe(result);
    expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
    fixture.nativeElement.querySelector('.btn-primary').click();
    expect(await result).toBeTrue();
    expect(fixture.nativeElement.querySelector('dialog').open).toBeFalse();
    fixture.destroy();
  });

  it('cancels on Escape and resolves pending requests on destruction', async () => {
    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    const result = fixture.componentInstance.confirm();
    fixture.nativeElement.querySelector('dialog').dispatchEvent(new Event('cancel', {cancelable: true}));
    expect(await result).toBeFalse();
    const pending = fixture.componentInstance.confirm();
    fixture.destroy();
    expect(await pending).toBeFalse();
  });
});
