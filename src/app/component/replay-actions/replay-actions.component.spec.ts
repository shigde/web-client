import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {RecordedVideo, VideoService} from '@shigde/core';
import {of, Subject, throwError} from 'rxjs';
import {ReplayActionsComponent} from './replay-actions.component';

describe('Replay owner actions', () => {
  let component: ReplayActionsComponent;
  let videos: jasmine.SpyObj<VideoService>;
  let modal: jasmine.SpyObj<NgbModal>;
  const video = {uuid: 'replay', title: 'Title', description: '', support: '',
    status: 'ready', publishedAt: '2026-11-01T10:00:00Z'} as RecordedVideo;

  beforeEach(() => {
    videos = jasmine.createSpyObj('VideoService', ['update', 'delete', 'get']);
    modal = jasmine.createSpyObj('NgbModal', ['open']);
    component = new ReplayActionsComponent(videos, modal);
    component.video = {...video};
  });

  it('unpublishes without deleting video files', () => {
    videos.update.and.returnValue(of({...video, publishedAt: null}));
    component.setPublished(false);
    expect(videos.update).toHaveBeenCalledWith('replay', {published: false});
    expect(videos.delete).not.toHaveBeenCalled();
    expect(component.video.publishedAt).toBeNull();
  });

  it('saves replay metadata independently of the original stream', () => {
    videos.update.and.returnValue(of({...video, title: 'New title'}));
    component.title = ' New title ';
    component.description = 'Description';
    component.support = 'Support';
    component.published = false;
    component.save();
    expect(videos.update).toHaveBeenCalledWith('replay', {
      title: 'New title', description: 'Description', support: 'Support', published: false,
    });
  });

  it('only deletes on explicit confirmation and blocks an active recording', () => {
    videos.delete.and.returnValue(of(undefined));
    const deleted = jasmine.createSpy('deleted');
    component.deleted.subscribe(deleted);
    expect(videos.delete).not.toHaveBeenCalled();
    component.video = {...video, status: 'recording'};
    component.deletePermanently();
    expect(videos.delete).not.toHaveBeenCalled();
    component.video = {...video};
    component.deletePermanently();
    expect(videos.delete).toHaveBeenCalledWith('replay');
    expect(deleted).toHaveBeenCalledWith('replay');
  });

  it('retains a failed deletion for retry rather than claiming success', () => {
    videos.delete.and.returnValue(throwError(() => new Error('disk failure')));
    videos.get.and.returnValue(of({...video, status: 'deleting', publishedAt: null}));
    const deleted = jasmine.createSpy('deleted');
    component.deleted.subscribe(deleted);
    component.deletePermanently();
    expect(deleted).not.toHaveBeenCalled();
    expect(component.error()).toContain('retry');
    expect(component.video.status).toBe('deleting');
    expect(component.busy()).toBeFalse();
  });

  it('restores the publish switch on failure and disables changes while saving', () => {
    const result = new Subject<RecordedVideo>();
    videos.update.and.returnValue(result);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = false;
    component.togglePublished({target: input} as unknown as Event);
    expect(input.checked).toBeTrue();
    expect(component.busy()).toBeTrue();
    component.setPublished(false);
    expect(videos.update.calls.count()).toBe(1);
    result.error(new Error('offline'));
    expect(component.video.publishedAt).toBe(video.publishedAt);
    expect(component.busy()).toBeFalse();
    expect(component.error()).toContain('could not be updated');
  });

  it('does not publish a failed recording', () => {
    component.video = {...video, publishedAt: null, status: 'failed'};
    component.setPublished(true);
    expect(videos.update).not.toHaveBeenCalled();
  });
});
