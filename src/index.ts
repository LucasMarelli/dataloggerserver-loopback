import {instantiateClass} from '@loopback/core';
import Aedes, {PublishPacket} from 'aedes';
import {createServer} from 'net';
import {ApplicationConfig, DataloggerSeverApplication} from './application';
import {DeviceService} from './services';
const mongoBaseURL = 'mongodb+srv://admin:kkABJgZYeWXY10SD@clusterdataloggers.8dgkxrd.mongodb.net'
const mongoURL = mongoBaseURL + '/dataloggers'
const mongoMqttURL = mongoBaseURL + '/mqtt'

export * from './application';

export async function main(options: ApplicationConfig = {}) {
  const app = new DataloggerSeverApplication(options);
  await app.boot();
  await app.start();
  const bindings = app.find().map((a) => a.key)
  // const deviceService = await app.get("services.device.service")
  // const deviceRepository = await app.getRepository(DeviceRepository)
  const deviceService = await instantiateClass(DeviceService, app)
  await deviceService.disconnectAll();
  const mqttPort = 1883
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
  const mqttServer = createServer(aedes.handle)

  mqttServer.listen(mqttPort, function () {
    console.log('server started and listening on port ', mqttPort)
  })

  aedes.on('subscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
      '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', aedes.id);
    aedes.publish({topic: 'hello/world', payload: "I'm broker " + aedes.id} as PublishPacket, () => { })
  })

  aedes.on('unsubscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
      '\x1b[0m unsubscribed to topics: ' + subscriptions.join('\n'), 'from broker', aedes.id)
  })

  // fired when a client connects
  aedes.on('client', function (client) {
    if (client) deviceService.connect(client.id)
    console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
  })

  // fired when a client disconnects
  aedes.on('clientDisconnect', function (client) {
    if (client) deviceService.disconnect(client.id)
    console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
  })



  // fired when a message is published
  aedes.on('publish', async function (packet, client) {
    if (client) console.log('Client \x1b[31m' + (client ? client.id : 'BROKER_' + aedes.id) + '\x1b[0m has published', packet.payload.toString(), 'on', packet.topic, 'to broker', aedes.id)
  })



  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
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
