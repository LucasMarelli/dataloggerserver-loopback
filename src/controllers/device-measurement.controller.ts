import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  param,
  patch,
  post,
  requestBody,
} from '@loopback/rest';
import {
  Device,
  Measurement,
} from '../models';
import {DeviceRepository} from '../repositories';

export class DeviceMeasurementController {
  constructor(
    @repository(DeviceRepository) protected deviceRepository: DeviceRepository,
  ) { }

  @get('/devices/{id}/measurements', {
    responses: {
      '200': {
        description: 'Array of Device has many Measurement',
        content: {
          'application/json': {
            schema: {type: 'array', items: getModelSchemaRef(Measurement)},
          },
        },
      },
    },
  })
  async find(
    @param.path.string('id') id: string,
    @param.query.object('filter') filter?: Filter<Measurement>,
  ): Promise<Measurement[]> {
    return this.deviceRepository.measurements(id).find(filter);
  }

  @post('/devices/{id}/measurements', {
    responses: {
      '200': {
        description: 'Device model instance',
        content: {'application/json': {schema: getModelSchemaRef(Measurement)}},
      },
    },
  })
  async create(
    @param.path.string('id') id: typeof Device.prototype.id,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Measurement, {
            title: 'NewMeasurementInDevice',
            exclude: ['id'],
            optional: ['deviceId']
          }),
        },
      },
    }) measurement: Omit<Measurement, 'id'>,
  ): Promise<Measurement> {
    return this.deviceRepository.measurements(id).create(measurement);
  }

  @patch('/devices/{id}/measurements', {
    responses: {
      '200': {
        description: 'Device.Measurement PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async patch(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Measurement, {partial: true}),
        },
      },
    })
    measurement: Partial<Measurement>,
    @param.query.object('where', getWhereSchemaFor(Measurement)) where?: Where<Measurement>,
  ): Promise<Count> {
    return this.deviceRepository.measurements(id).patch(measurement, where);
  }

  @del('/devices/{id}/measurements', {
    responses: {
      '200': {
        description: 'Device.Measurement DELETE success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async delete(
    @param.path.string('id') id: string,
    @param.query.object('where', getWhereSchemaFor(Measurement)) where?: Where<Measurement>,
  ): Promise<Count> {
    return this.deviceRepository.measurements(id).delete(where);
  }
}
