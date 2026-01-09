/**
 * mqtt-client.ts
 * @author Andrew Roberts
 */

import mqtt from "mqtt";

function MqttClient({ hostUrl, username, password, clientId }: any) {
  let client: any = null;

  // connects client to message broker and ensures connack is received
  async function connect() {
    return new Promise((resolve, reject) => {
      client = mqtt.connect(hostUrl, {
        username: username,
        password: password,
        clientId: clientId
      });
      client.on("connect", function onConnAck() {
        resolve(undefined);
      });
      client.on("error", function onConnError(error: any) {
        reject(error);
      });
    });
  }

  // publishes message to provided topic and ensures puback is received
  async function send(topic: any, message: any, qos: any = 0) {
    return new Promise((resolve, reject) => {
      // guard: prevent attempting to interact with client that does not exist
      if (!client) {
        reject(new Error("Client has not connected yet"));
        return;
      }

      client.publish(
        topic,
        message,
        { qos }, // options
        function onPubAck(err: any) {
          // guard: err != null indicates client is disconnecting
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  return {
    connect,
    send
  };
}

export default MqttClient;