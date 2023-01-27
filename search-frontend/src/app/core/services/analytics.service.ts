import { Injectable } from '@angular/core';
import { ModuleData } from '../models/ModuleData';

// tslint:disable-next-line:ban-types
declare const gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() { }

  sendEvent(eventName: string, params: any): void {
    console.log(`Sending analytics event '${eventName}' with body:`);
    console.log(params);
    gtag('event', eventName, params);
  }

  sendSearchEvent(params: any, moduleData?: ModuleData): void {
    this.sendEvent('search', {
      ...params, ...moduleData?.getAnalyticsPayload()
    });
  }
}
