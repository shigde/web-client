import {Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor, HttpResponse, HttpEventType
} from '@angular/common/http';
import {Observable, tap} from 'rxjs';

const headerName = 'X-Req-Token'

@Injectable()
export class ReqTokenInterceptor implements HttpInterceptor {
  private token: string | null = null

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const urlIsInList = this.isUrlInWhiteList(request.url)
    if (this.token != null && urlIsInList && request.url && !request.headers.has(headerName)) {
      request = request.clone({headers: request.headers.set(headerName, this.token)});
    }

    return next.handle(request).pipe(tap((httpEvent: HttpEvent<any>) => {
        // Skip request
        if (httpEvent.type === HttpEventType.Sent) {
          return;
        }
        console.log('response: ', httpEvent);

        if (httpEvent instanceof HttpResponse) {
          if (httpEvent.headers.has(headerName)) {
            this.token = httpEvent.headers.get(headerName);
          }
        }
      }
    ));
  }

  private isUrlInWhiteList(url: string): boolean {
    return url.endsWith('whep')
  }
}
