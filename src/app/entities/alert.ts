export interface Alert {
  kind: AlertKind,
  msg: string,
  closed: () => void,
}

export enum AlertKind {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  DANGER = 'danger',
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  LIGHT = 'light',
  DARK = 'dark'
}
