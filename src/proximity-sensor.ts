/**
 * proximity-sensor.ts
 * @author Thomas Kunnumpurath
 */

import { Board, Proximity } from "johnny-five";

// Since pi-io doesn't have TypeScript definitions, we'll use require and type it
const PiIO = require("pi-io");

class ProximitySensor {
  private sensor: any = null;

  async connectToBoard() {
    return new Promise((resolve, reject) => {
      const board = new Board({
        io: new PiIO()
      });

      board.on("ready", () => {
        this.sensor = new Proximity({
          controller: PiIO.HCSR04,
          triggerPin: "GPIO23",
          echoPin: "GPIO24"
        });

        resolve(undefined);
      });

      board.on("error", (error: any) => {
        reject(error || new Error("Unknown board error"));
      });
    });
  }

  // adds proximity sensor handler for a given range
  addProximityHandler(minRangeCm: any = 0, maxRangeCm: any, handler: any) {
    console.log(`Enabling range of proximity detection to be [${minRangeCm},${maxRangeCm}]cms`);
    
    if (!this.sensor) {
      throw new Error("Sensor not initialized. Call connectToBoard() first.");
    }

    this.sensor.on("data", (measurement: any) => {
      if (measurement.cm > minRangeCm && measurement.cm < maxRangeCm) {
        handler(measurement);
      }
    });
  }

  // adds range detector handler for a given range
  addRangeDetectorHandler(minRangeCm: any, maxRangeCm: any, handler: any) {
    if (!this.sensor) {
      throw new Error("Sensor not initialized. Call connectToBoard() first.");
    }

    this.sensor.within([minRangeCm, maxRangeCm], "cm", () => {
      handler();
    });
  }
}

export default ProximitySensor;