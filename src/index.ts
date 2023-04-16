import {instantiateClass} from '@loopback/core';
import Aedes from 'aedes';
import {createServer} from 'net';
import {ApplicationConfig, DataloggerSeverApplication} from './application';
import {ConfigService, DeviceService, MqttService} from './services';
const mongoBaseURL = 'mongodb+srv://admin:kkABJgZYeWXY10SD@clusterdataloggers.8dgkxrd.mongodb.net'
const mongoURL = mongoBaseURL + '/dataloggers'
const mongoMqttURL = mongoBaseURL + '/mqtt'

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new DataloggerSeverApplication(options);
  await app.boot();
  await app.start();
  const bindings = app.find().map((a) => a.key)
  const deviceService = await instantiateClass(DeviceService, app)
  await deviceService.disconnectAll();
  const configService = await instantiateClass(ConfigService, app)
  const config = await configService.init()
  const mqttPort = 1887
  const aedesPersistenceMongoDB = require('aedes-persistence-mongodb')
  const persistence = aedesPersistenceMongoDB({
    url: mongoMqttURL,
    ttl: {
      packets: {
        incoming: 10000,
        outgoing: 10000,
        will: 10000,
        retained: -1
      },
      // Number of seconds
      subscriptions: -1,
    }
  })

  const aedes = new Aedes({persistence})
  app.bind<Aedes>("aedes").to(aedes);
  const mqttServer = createServer(aedes.handle)
  const mqttService = await instantiateClass(MqttService, app);
  mqttServer.listen(mqttPort, function () {
    console.log('server started and listening on port ', mqttPort)
  })

  aedes.on('subscribe', mqttService.handlersubscribe)

  aedes.on('unsubscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
      '\x1b[0m unsubscribed to topics: ' + subscriptions.join('\n'), 'from broker', aedes.id)
  })

  // fired when a client connects
  aedes.on('client', mqttService.hadleConnection)

  // fired when a client disconnects
  aedes.on('clientDisconnect', mqttService.handleDisconnection)

  // fired when a message is published
  aedes.on('publish', mqttService.handlePublish)

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3001),
      host: process.env.HOST,
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
