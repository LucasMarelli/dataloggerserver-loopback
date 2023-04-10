import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {Device} from '../models';
import {DeviceRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class DeviceService {
  constructor(
    @repository(DeviceRepository)
    private deviceRepository: DeviceRepository
  ) { }
  async connect(mqttId: string) {
    const now = new Date()
    const device = {mqttId, status: "connected", lastConnection: now} as Device
    const existingDevice = await this.deviceRepository.findOne({where: {mqttId: device.mqttId}, fields: {id: true}})
    let newDevice: Device
    if (existingDevice) {
      await this.deviceRepository.updateById(existingDevice.id, {...device})
      newDevice = await this.deviceRepository.findById(existingDevice.id)
    } else {
      newDevice = await this.deviceRepository.create({...device, createdAt: now, })
    }
    return newDevice
  }

  async disconnect(mqttId: string) {
    const now = new Date();
    return await this.deviceRepository.updateAll({status: "not_connected", lastDisconnection: now}, {mqttId})
  }
}
