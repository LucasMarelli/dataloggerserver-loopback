import { /* inject, */ BindingScope, inject, injectable, service} from '@loopback/core';
import Aedes, {AedesPublishPacket, Client, PublishPacket, Subscription} from 'aedes';
import {Device} from '../models';
import {ConfigService} from './config.service';
import {DeviceService} from './device.service';

@injectable({scope: BindingScope.TRANSIENT})
export class MqttService {
  constructor(
    @inject("aedes")
    private aedes: Aedes,
    @service(DeviceService)
    private deviceService: DeviceService,
    @service(ConfigService)
    private configService: ConfigService
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
        const config = await this.configService.getConfig();
        if (config?.defaultSamplingTime!) {
          await this.deviceService.updateSamplingTime(device.id!, config?.defaultSamplingTime)
          device = await this.deviceService.deviceRepository.findById(device.id)
        }
      } else {
        console.error("No default sampling time in congig file - Sampling time not setted to device")
      }
      this.aedes.publish({topic: 'device/config/' + client.id, payload: String(device.samplingTime)} as PublishPacket, (error) => {if (error) console.error(error)})

    }
    console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', this.aedes.id)
    this.aedes.publish({topic: 'device/conected', payload: "I'm broker " + this.aedes.id} as PublishPacket, (error) => {if (error) console.error(error)})

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
            const measurement = await this.deviceService.addMeasurement(client.id, Number(packet.payload))
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
    this.aedes.publish({topic: 'device/config/', payload: String(samplingTime)} as PublishPacket, (error) => {if (error) console.error(error)})
  }

}
