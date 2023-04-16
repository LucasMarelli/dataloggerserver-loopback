import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {ConfigRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class ConfigService {
  constructor(
    @repository(ConfigRepository)
    private configRepository: ConfigRepository
  ) { }

  async init() {
    let config = await this.getConfig()
    if (!config) config = await this.configRepository.create({})
    return config
  }

  async getConfig() {
    return this.configRepository.findOne({
      order: ['id DESC']
    })
  }
}
