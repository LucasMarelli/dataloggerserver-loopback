import {BindingKey} from '@loopback/core';
import {DeviceService} from './services';

export const DEVICE_SERVICE = BindingKey.create<DeviceService>('service.device');
