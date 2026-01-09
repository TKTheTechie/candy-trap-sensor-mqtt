/**
 * mqtt-client.ts
 * @author Andrew Roberts
 */

import mqtt, { MqttClient as MqttClientType } from "mqtt";

interface MqttClientConfig {
  hostUrl: string;
  username: string;
  password: string;
  clientId: string;
}

interface MqttClientInterface {
  connect(): Promise<void>;
  send(topic: string, message: string | Buffer, qos?: 0 | 1 | 2): Promise<void>;
}

function MqttClient({ hostUrl, username, password, clientId }: MqttClientConfig): MqttClientInterface {
  let client: MqttClientType | null = null;

  // connects client to message broker and ensures connack is received
  async function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      client = mqtt.connect(hostUrl, {
        username: username,
        password: password,
        clientId: clientId
      });
      client.on("connect", function onConnAck() {
        resolve();
      });
      client.on("error", function onConnError(error: Error) {
        reject(error);
      });
    });
  }

  // publishes message to provided topic and ensures puback is received
  async function send(topic: string, message: string | Buffer, qos: 0 | 1 | 2 = 0): Promise<void> {
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
        function onPubAck(err?: Error) {
          // guard: err != null indicates client is disconnecting
          if (err) reject(err);
          else resolve();
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