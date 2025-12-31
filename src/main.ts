/// <reference types="@angular/localize" />

import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {createAppLogger, enableLogger, LEVEL} from '@shigde/core';

let logger = createAppLogger('main');
enableLogger(LEVEL.ALL);

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => logger.error(err));
