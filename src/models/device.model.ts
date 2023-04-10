import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class Device extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    default: "not_connected",
  })
  status?: "not_connected" | "connected";

  @property({
    type: 'string',
  })
  name?: string;

  @property({
    type: 'string',
  })
  mqttId?: string;

  @property({
    type: 'date',
    dafault: new Date()
  })
  createdAt?: Date;

  @property({
    type: 'date',
    dafault: new Date()
  })
  lastConnection?: Date;

  @property({
    type: 'date',
    dafault: new Date()
  })
  lastDisconnection?: Date;

  // Define well-known properties here

  // Indexer property to allow additional data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [prop: string]: any;

  constructor(data?: Partial<Device>) {
    super(data);
  }
}

export interface DeviceRelations {
  // describe navigational properties here
}

export type DeviceWithRelations = Device & DeviceRelations;
