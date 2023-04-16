import {inject, Getter} from '@loopback/core';
import {DefaultCrudRepository, repository, HasManyRepositoryFactory} from '@loopback/repository';
import {MongoDbDataSource} from '../datasources';
import {Device, DeviceRelations, Measurement} from '../models';
import {MeasurementRepository} from './measurement.repository';

export class DeviceRepository extends DefaultCrudRepository<
  Device,
  typeof Device.prototype.id,
  DeviceRelations
> {

  public readonly measurements: HasManyRepositoryFactory<Measurement, typeof Device.prototype.id>;

  constructor(
    @inject('datasources.MongoDB') dataSource: MongoDbDataSource, @repository.getter('MeasurementRepository') protected measurementRepositoryGetter: Getter<MeasurementRepository>,
  ) {
    super(Device, dataSource);
    this.measurements = this.createHasManyRepositoryFactoryFor('measurements', measurementRepositoryGetter,);
    this.registerInclusionResolver('measurements', this.measurements.inclusionResolver);
  }
}
