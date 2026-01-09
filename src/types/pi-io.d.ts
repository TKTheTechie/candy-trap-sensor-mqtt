declare module "pi-io" {
  interface PiIOOptions {
    [key: string]: any;
  }

  class PiIO {
    constructor(options?: PiIOOptions);
    static HCSR04: string;
  }

  export = PiIO;
}