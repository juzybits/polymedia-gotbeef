/// Miscellaneous convenience functions and constants

export const isDev = window.location.hostname=='localhost' || window.location.hostname.includes('dev');
export const isProd = !isDev;
