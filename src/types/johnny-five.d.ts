declare module "johnny-five" {
  export class Board {
    constructor(options?: any);
    on(event: any, callback: any): void;
  }

  export class Proximity {
    constructor(options: any);
    on(event: any, callback: any): void;
    within(range: any, unit: any, callback: any): void;
  }
}