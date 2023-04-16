import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {configService, mqttService} from '..';
import {Device} from '../models';
import {DeviceRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class DeviceService {
  constructor(
    @repository(DeviceRepository)
    public deviceRepository: DeviceRepository,
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

  async disconnectAll() {
    return await this.deviceRepository.updateAll({status: "not_connected"})
  }

  async addMeasurement(mqttId: string, value: number) {
    const now = new Date()
    const device = await this.deviceRepository.findOne({where: {mqttId}})
    if (!device) throw new HttpErrors.NotFound("Device Not found")
    return this.deviceRepository.measurements(device.id).create({createdAt: now, value, unit: device.unit})
  }

  async findByMqttId(mqttId: string) {
    return this.deviceRepository.findOne({where: {mqttId}})
  }

  async updateSamplingTime(id: string, samplingTime: number) {
    return this.deviceRepository.updateById(id, {samplingTime})
  }

  async updateSamplingTimeAll(samplingTime: number) {
    await configService.updateSamplingTime(samplingTime)
    mqttService.publishSamplingTime(samplingTime)
    return this.deviceRepository.updateAll({samplingTime})
  }
}
