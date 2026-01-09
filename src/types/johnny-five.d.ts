declare module "johnny-five" {
  export interface BoardOptions {
    io?: any;
    [key: string]: any;
  }

  export interface ProximityOptions {
    controller?: any;
    triggerPin?: string;
    echoPin?: string;
    [key: string]: any;
  }

  export interface ProximityMeasurement {
    cm: number;
    in: number;
  }

  export class Board {
    constructor(options?: BoardOptions);
    on(event: "ready", callback: () => void): void;
    on(event: "error", callback: (error?: Error) => void): void;
    on(event: string, callback: (...args: any[]) => void): void;
  }

  export class Proximity {
    constructor(options: ProximityOptions);
    on(event: "data", callback: (measurement: ProximityMeasurement) => void): void;
    within(range: [number, number], unit: string, callback: () => void): void;
  }
}