import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FederativeService {

  constructor() {
  }

  public static splitDomainNameToJson(name: string): { domain: string, name: string } {
    let split = name.split('@');
    if (split.length > 1) {
      return {'domain': split[1], 'name': split[0]};
    }
    return {'domain': '', 'name': split[0]};
  }

  public static joinDomainNameToString(name: string, domain: string): string {
    return `${name}@${domain}`;
  }
}
