/**
 * index.js
 *
 * @author Thomas Kunnumpurath
 */

// polyfill async
import "core-js";
import "regenerator-runtime";
// load env variables
import dotenv from "dotenv";

let result = dotenv.config();
if (result.error) {
  throw result.error;
}
import MqttClient from "./mqtt-client.js";
import ProximitySensor from "./proximity-sensor.js";

async function run() {
  // initialize and connect mqtt client
  let mqttClientConfig = {
    hostUrl: process.env.SOLACE_MQTT_HOST_URL,
    username: process.env.SOLACE_USERNAME,
    password: process.env.SOLACE_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID
  };

  console.log("=== Starting MQTT producer ===");

  let mqttClient;

  try {
    mqttClient = MqttClient(mqttClientConfig);
    console.log("Connecting MQTT client to Solace...");
    await mqttClient.connect();
    console.log("MQTT client connected to Solace.");
  } catch (err) {
    console.error(err);
    process.exit();
  }

  let proximitySensor;

  try {
    //Connect to the Raspberry PI
    proximitySensor = new ProximitySensor();
    console.log("Connecting to board...");
    await proximitySensor.connectToBoard();
    console.log("Connected to the board!");
  } catch (err) {
    console.error(err);
    process.exit();
  }

  let lastPublishTime = 0;
  let firstEventPublished = false;
  const WAIT_TIME = Number(process.env.WAIT_TIME) || 0;
  const WAIT_TIME_BETWEEN_ALERTS = Number(process.env.WAIT_TIME_BETWEEN_ALERTS) || 0;

  const fetch = (await import('node-fetch')).default;
  proximitySensor.addProximityHandler(process.env.MIN_RANGE_CM, process.env.MAX_RANGE_CM, async measurement => {
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
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image from ESP32 webcam server');
      const imageBuffer = await response.buffer();
      // Publish image as message body (binary)
      console.log(`Publishing image from ESP32 webcam server.`);
      await mqttClient.send(process.env.MQTT_TOPIC, imageBuffer);
    } catch (err) {
      console.error('Error fetching or publishing image:', err);
    }
  });
}

run();
