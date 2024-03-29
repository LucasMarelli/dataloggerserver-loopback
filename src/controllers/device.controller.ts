import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  model,
  property,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {Device} from '../models';
import {DeviceRepository} from '../repositories';
import {DeviceService} from '../services';

@model()
export class SamplingTimeBody {
  @property({
    type: 'number',
    required: true,
  })
  samplingTime: number;
}

export class DeviceController {
  constructor(
    @repository(DeviceRepository)
    public deviceRepository: DeviceRepository,
    @service(DeviceService)
    public deviceService: DeviceService
  ) { }

  @post('/devices')
  @response(200, {
    description: 'Device model instance',
    content: {'application/json': {schema: getModelSchemaRef(Device)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Device, {
            title: 'NewDevice',
            exclude: ['id'],
          }),
        },
      },
    })
    device: Omit<Device, 'id'>,
  ): Promise<Device> {
    return this.deviceRepository.create(device);
  }

  @get('/devices/count')
  @response(200, {
    description: 'Device model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Device) where?: Where<Device>,
  ): Promise<Count> {
    return this.deviceRepository.count(where);
  }

  @get('/devices')
  @response(200, {
    description: 'Array of Device model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Device, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Device) filter?: Filter<Device>,
  ): Promise<Device[]> {
    return this.deviceRepository.find(filter);
  }

  @patch('/devices')
  @response(200, {
    description: 'Device PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Device, {partial: true}),
        },
      },
    })
    device: Device,
    @param.where(Device) where?: Where<Device>,
  ): Promise<Count> {
    return this.deviceRepository.updateAll(device, where);
  }

  @get('/devices/{id}')
  @response(200, {
    description: 'Device model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Device, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Device, {exclude: 'where'}) filter?: FilterExcludingWhere<Device>
  ): Promise<Device> {
    return this.deviceRepository.findById(id, filter);
  }

  @patch('/devices/{id}')
  @response(204, {
    description: 'Device PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Device, {partial: true}),
        },
      },
    })
    device: Device,
  ): Promise<void> {
    await this.deviceRepository.updateById(id, device);
  }

  @put('/devices/{id}')
  @response(204, {
    description: 'Device PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() device: Device,
  ): Promise<void> {
    await this.deviceRepository.replaceById(id, device);
  }

  @del('/devices/{id}')
  @response(204, {
    description: 'Device DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.deviceRepository.deleteById(id);
  }

  @patch('/devices/sampling-time')
  @response(204, {
    description: 'Device PATCH success',
  })
  async updateSamplingTime(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(SamplingTimeBody),
        },
      },
    })
    samplingTimeBody: SamplingTimeBody,
  ): Promise<void> {
    await this.deviceService.updateSamplingTimeAll(samplingTimeBody.samplingTime);
  }
}
