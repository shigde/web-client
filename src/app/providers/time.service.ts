import {Weekday} from '@shigde/core';

export class TimeService {

  static isLaterThenCurrentTime(hours: number, minutes: number): boolean {
    const date = new Date();
    if (date.getHours() < hours) {
      return true;
    }
    if (date.getHours() == hours) {
      return date.getMinutes() < minutes;
    }
    return false;
  }

  static isTodaySameWeekday(weekDay: Weekday): boolean {
    const day = new Date();
    return weekDay == day.getDay();
  }

  static nextWeekdayDate(weekDay: Weekday): Date {
    const day = new Date();
    const days = 7 - day.getDay() + weekDay;
    return new Date(day.setDate(day.getDate() + days));
  }

  static buildDaytime(day: Date, hours: number, minutes: number): Date {
    day.setHours(hours);
    day.setMinutes(minutes);
    return day;
  }

  static dateToISOButLocal(date: Date) {
    return date.toLocaleString('sv').replace(' ', 'T');
  }

  static formatDateToString(date: Date) {
    let month = '' + (date.getMonth() + 1),
      day = '' + date.getDate(),
      year = date.getFullYear();

    if (month.length < 2)
      month = '0' + month;
    if (day.length < 2)
      day = '0' + day;

    return [year, month, day].join('-');
  }

}
