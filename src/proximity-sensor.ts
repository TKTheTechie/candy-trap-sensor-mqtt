/**
 * proximity-sensor.ts
 * @author Thomas Kunnumpurath
 */

import { Board, Proximity } from "johnny-five";

// Since pi-io doesn't have TypeScript definitions, we'll use require and type it
const PiIO = require("pi-io");

interface ProximityMeasurement {
  cm: number;
  in: number;
}

interface ProximitySensorInterface {
  connectToBoard(): Promise<void>;
  addProximityHandler(minRangeCm: number, maxRangeCm: number, handler: (measurement: ProximityMeasurement) => void): void;
  addRangeDetectorHandler(minRangeCm: number, maxRangeCm: number, handler: () => void): void;
}

class ProximitySensor implements ProximitySensorInterface {
  private sensor: Proximity | null = null;

  async connectToBoard(): Promise<void> {
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

        resolve();
      });

      board.on("error", (error?: Error) => {
        reject(error || new Error("Unknown board error"));
      });
    });
  }

  // adds proximity sensor handler for a given range
  addProximityHandler(
    minRangeCm: number = 0, 
    maxRangeCm: number, 
    handler: (measurement: ProximityMeasurement) => void
  ): void {
    console.log(`Enabling range of proximity detection to be [${minRangeCm},${maxRangeCm}]cms`);
    
    if (!this.sensor) {
      throw new Error("Sensor not initialized. Call connectToBoard() first.");
    }

    this.sensor.on("data", (measurement: ProximityMeasurement) => {
      if (measurement.cm > minRangeCm && measurement.cm < maxRangeCm) {
        handler(measurement);
      }
    });
  }

  // adds range detector handler for a given range
  addRangeDetectorHandler(
    minRangeCm: number, 
    maxRangeCm: number, 
    handler: () => void
  ): void {
    if (!this.sensor) {
      throw new Error("Sensor not initialized. Call connectToBoard() first.");
    }

    this.sensor.within([minRangeCm, maxRangeCm], "cm", () => {
      handler();
    });
  }
}

export default ProximitySensor;