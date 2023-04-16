import {Entity, model, property} from '@loopback/repository';

@model()
export class Measurement extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'number',
    required: true,
  })
  value: number;

  @property({
    type: 'date',
    dafault: new Date()
  })
  createdAt?: Date;

  @property({
    type: 'string',
  })
  unit?: string;

  @property({
    type: 'string',
  })
  deviceId?: string;

  constructor(data?: Partial<Measurement>) {
    super(data);
  }
}

export interface MeasurementRelations {
  // describe navigational properties here
}

export type MeasurementWithRelations = Measurement & MeasurementRelations;
