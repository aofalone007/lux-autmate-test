import * as enMenu  from './en/menu';


import * as thMenu from './th/menu';

export const locales = {
  EN: { menu: enMenu.menu },
  TH: { menu: thMenu.menu }
};

export type Language = keyof typeof locales;