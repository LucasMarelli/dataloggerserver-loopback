import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import Aedes, {AedesPublishPacket, Client, PublishPacket, Subscription} from 'aedes';
import {configService} from '..';
import {Device} from '../models';
import {DeviceService} from './device.service';

@injectable({scope: BindingScope.TRANSIENT})
export class MqttService {
  readonly qos = 1;
  constructor(
    @inject("aedes")
    private aedes: Aedes,
    @service(DeviceService)
    private deviceService: DeviceService,
  ) { }

  handlersubscribe = (subscriptions: Subscription[], client: Client) => {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
      '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', this.aedes.id);
  }

  hadleConnection = async (client: Client) => {
    let device: Device
    if (client) {
      device = await this.deviceService.connect(client.id)
      if (!device?.samplingTime) {
        const config = await configService.getConfig();
        if (config?.defaultSamplingTime) {
          await this.deviceService.updateSamplingTime(device.id!, config?.defaultSamplingTime)
          device = await this.deviceService.deviceRepository.findById(device.id)
        } else {
          console.error("No default sampling time in congig file - Sampling time not setted to device")
        }
      }
      client.subscribe({topic: "device/config/" + client.id, qos: this.qos}, (error) => {if (error) console.error(error)})
      if (device.samplingTime) this.publishSamplingTimeToDevice(client.id, device.samplingTime)
    }
    console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', this.aedes.id)
    this.aedes.publish({topic: 'device/conected', payload: "I'm broker " + this.aedes.id, qos: this.qos} as PublishPacket, (error) => {if (error) console.error(error)})

  }

  handleDisconnection = (client: Client) => {
    if (client) this.deviceService.disconnect(client.id)
    console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', this.aedes.id)
  }

  handlePublish = async (packet: AedesPublishPacket, client: Client | null) => {
    if (client) {
      console.log('Client \x1b[31m' + (client ? client.id : 'BROKER_' + this.aedes.id) + '\x1b[0m has published', packet.payload.toString(), 'on', packet.topic, 'to broker', this.aedes.id)
      const {topic} = packet
      switch (topic) {
        case "device/measurement":
          try {
            let [value, epochTime] = String(packet.payload).split("/")
            const date = new Date(Number(epochTime) * 1000)
            const measurement = await this.deviceService.addMeasurement(client.id, Number(value), date)
          }
          catch (error) {
            console.error(error)
          }
          break;
        default:
          break;
      }
    }

  }
  publishSamplingTime(samplingTime: number) {
    this.aedes.publish({topic: 'device/config', payload: String(samplingTime), qos: this.qos} as PublishPacket, (error) => {if (error) console.error(error)})
  }

  publishSamplingTimeToDevice(mqttId: string, samplingTime: number) {
    this.aedes.publish({topic: 'device/config/' + mqttId, payload: String(samplingTime), qos: this.qos} as PublishPacket, (error) => {if (error) console.error(error)})
  }

}
