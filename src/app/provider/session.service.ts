import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Observer, of, Subject} from 'rxjs';
import {User} from '../entities/user';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly users: User[] = [
    {id: 'owner', name: 'Owner'},
    {id: 'guest-1', name: 'Guest 1'},
    {id: 'guest-2', name: 'Guest 2'},
    {id: 'guest-3', name: 'Guest 3'},
    {id: 'guest-4', name: 'Guest 4'},
  ];

  private readonly userName$: Subject<string>
  private readonly anonymous = 'anonymous'

  constructor() {
    const user = localStorage.getItem('user')
    this.userName$ = new BehaviorSubject<string>(user === null ? this.anonymous : user)
  }

  isActive(): Observable<boolean> {
    const user = localStorage.getItem('user')
    return of(user !== null)
  }

  getUserName(): Observable<string> {
    return this.userName$
  }

  setUserName(user: User): boolean {
    const found = this.users.find((list) => list.id === user.id)
    if(found === undefined) {
      return false
    }
    localStorage.setItem('user', user.name);
    this.userName$.next(user.name)
    return true
  }

  getUsers(): User[] {
    return this.users
  }
  public removeUser(key: string) {
    localStorage.removeItem('user');
    this.userName$.next(this.anonymous)
  }

  public clearData() {
    localStorage.clear();
    this.userName$.next(this.anonymous)
  }
}
