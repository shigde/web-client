import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, Observer, of, Subject} from 'rxjs';
import {User} from '../entities/user';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private readonly users: User[] = [
    {id: 'owner', name: 'Owner', token: token1},
    {id: 'guest-1', name: 'Guest 1', token: token2},
    {id: 'guest-2', name: 'Guest 2', token: token3},
    {id: 'guest-3', name: 'Guest 3', token: token4},
    {id: 'guest-4', name: 'Guest 4', token: token5},
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
    if (found === undefined) {
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

  public getToken(): string {
    const userName = localStorage.getItem('user');
    if (userName === null) {
      return ''
    }
    const user = this.users.find(items => items.name === userName)
    if (user === undefined) {
      return ''
    }
    return user.token
  }
}

const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiYTY0MzY1ZGItMTc0ZC00ZDExLThjYjEtZWIyYTM2MzlmZmU2In0._xbasA_1ljeszeWdqYqp96EWvJIbCnYOTOFxKgcd7vM'
const token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiOWJlZGMwZDktZWM2MS00ZmY0LWI4MWEtOGZkZGU0NWY3MzI3In0.831begOFS84xV-7BpXYlVgg3A2hMf4xbPWoXRs4m0qg'
const token3 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiNzBiZTg2ODItNzk5Yy00MjdmLWI3MjgtZmQwMDhjNTYzYWFjIn0.mLT7DRp50QP6OqqxBQmf4VSx02i3cA0jk89UMdXLhBY'
const token4 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiMjhiYmYzNTctYTFmNy00NDkwLWIxZjItYTYzN2E0YWU5YmFlIn0.wMfmkJ0VBj86tW5NfQnnV91j2YT-mUZeM_E9qbt_bjg'
const token5 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJ1dWlkIjoiZmUwMjI2NDgtYTBlOS00NDQ0LTlkNGQtYTRjMGQ5ZWZiNmQ3In0.HgWacVwFeEgYBG6iDJYlQ25VTymM0xHpnppjWGrzOp4'
