/**
 * index.ts
 *
 * @author Thomas Kunnumpurath
 */

// load env variables
const dotenv = require("dotenv");
import fetch from "node-fetch";

const result = dotenv.config();
if (result.error && result.error.code !== 'ENOENT') {
  throw result.error;
}

import MqttClient from "./mqtt-client";
import ProximitySensor from "./proximity-sensor";

// Global variables for timing control
let firstEventPublished = false;
let lastPublishTime = 0;
const WAIT_TIME = 5000; // 5 seconds initial wait
const WAIT_TIME_BETWEEN_ALERTS = 10000; // 10 seconds between alerts

async function run() {
  // initialize and connect mqtt client
  const mqttClientConfig = {
    hostUrl: process.env.SOLACE_MQTT_HOST_URL!,
    username: process.env.SOLACE_USERNAME!,
    password: process.env.SOLACE_PASSWORD!,
    clientId: process.env.MQTT_CLIENT_ID!
  };

  console.log("=== Starting MQTT producer ===");

  let mqttClient: any;

  try {
    mqttClient = MqttClient(mqttClientConfig);
    console.log("Connecting MQTT client to Solace...");
    await mqttClient.connect();
    console.log("MQTT client connected to Solace.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  let proximitySensor: any;

  try {
    // Connect to the Raspberry PI
    proximitySensor = new ProximitySensor();
    console.log("Connecting to board...");
    await proximitySensor.connectToBoard();
    console.log("Connected to the board!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  const minRange = parseInt(process.env.MIN_RANGE_CM || "0", 10);
  const maxRange = parseInt(process.env.MAX_RANGE_CM || "100", 10);

  proximitySensor.addProximityHandler(minRange, maxRange, async (measurement: any) => {
    const now = Date.now();
    
    if (!firstEventPublished) {
      // Wait for WAIT_TIME before first publish
      await new Promise(resolve => setTimeout(resolve, WAIT_TIME));
      firstEventPublished = true;
      lastPublishTime = now;
    } else {
      // Wait until WAIT_TIME_BETWEEN_ALERTS has passed since last publish
      if (now - lastPublishTime < WAIT_TIME_BETWEEN_ALERTS) {
        return;
      }
      lastPublishTime = now;
    }
    
    try {
      const imageUrl = process.env.ESP32_WEBCAM_SERVER_URL;
      if (!imageUrl) {
        throw new Error('ESP32_WEBCAM_SERVER_URL environment variable not set');
      }

      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch image from ESP32 webcam server');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      
      // Publish image as message body (binary)
      console.log(`Publishing image from ESP32 webcam server.`);
      await mqttClient.send(process.env.MQTT_TOPIC!, imageBuffer);
    } catch (err) {
      console.error('Error fetching or publishing image:', err);
    }
  });
}

run().catch(err => {
  console.error('Unhandled error in main function:', err);
  process.exit(1);
});