# Kafka Queue

Wrapper around Kafka with built in assumptions to make a keyed-message queuing system a little easier to build.
This wrapper was built to support an IoT -like system, where devices in the outside world are communicating
to a cloud service.  Each device has a unique deviceId.  Any process that consumes a device should consume
devices with the same deviceId always, and those messages should arrive in order.

This wrapper uses the [no-kafka](https://github.com/oleksiyk/kafka) library, which supports retries on connection
failures automatcially.  This wrapper was developed and tested using [this](https://hub.docker.com/r/ches/kafka/)
docker container.

## Usage

### Producer (enqueue)

```javascript
// app should be { config: log: } at minimum (ala express)
let Q = require( 'kafka-queue' )( app );
Q.producer.connect( function( err ) {
  if ( err ) exit( err );
  let message = { deviceId: '1001', p1: 'p1', p2: 'p2' };
  Q.producer.send( queueName, message, function( err ) {
    if ( err ) console.error( err );
    exit();
  });
});
```

### Consumer (dequeue)

```javascript
let Q = require( 'kafka-queue' )( app );
Q.consumer.connect( queueName, groupName, function( message ) {
  let handle = message.handle;
  let msg = message.msg;

  console.log( JSON.stringify( msg ) );
  // when you know processing is good/done, advance the consumer's position in the queue
  // to the next message.
  Q.consumer.commit( handle, function( err ) {
    if ( err ) console.error( 'commit error:', err );
  });
});
```

### Config

This wrapper expects `app.config.kafkaQueue` to look like:

```javascript
{
  "keyField": "deviceId",
  "connectionString": "192.168.99.103:9092",
  "logger": {
    "logLevel": 1
  }
}
```

The config is generally the same as documented [here](https://github.com/oleksiyk/kafka).  The `keyField` is required and is
the name of the field in the incoming messages (being passed to producer.send()) that contains the device id that you want to use
as a key.

## Example Application

You can run a simple test in this directory.  The test environment consists of an "ingest.js" script that emulates three
devices sending messages into the system.  These messages get sent to the "ingest" queue.  There is a "relayer.js" script
that reads from the ingest queue and duplicates those incoming messages to a "staging" queue and a "prod" queue.  There
is a "pipeline.js" script that reads from the staging or prod queue (specifiy on the command line) and prints the messages
to stdout.

If you create the "ingest" queue with one partition, you can run one instance of relayer.js.  If you create the queue with
two partions you can run two instances of the relayer.js script ... and so forth.  Same with the other queues.  Let us say
that you create all three (ingest, staging, prod) with 2 partions each.  Then you can run 2 instances of the relayer.js script
and four instances of the pipeline.js script; two with "staging" as an argument and two with "prod" as an argument.  Then run
ingest.js and you'll see messages flow through the system, being duplicated into the two stacks and being "worked on" in the
pipeline scripts.

If you kill one of the instances in a pair, you'll see the other instance begin to take over the processing of the killed
instance.  If you restart the killed instance, it'll begin to process its own messages again.

You should see that messages with id 'X' will always get sent to a consistent instance of the pipeline.js script, except
when that instance dies, in which case 'X' will start getting processed by a remaining instance.

### Setting up Kafka for this example

Create a docker machine to host zookeeper and kafka.  Note the IP address for this docker machine (DOCKER_HOST).
Edit "RUN.sh" and replace 192.168.99.103 with the IP address of your docker machine.  Then execute "sh RUN.sh".

## Reference Documentation

* [High level intro](http://blog.cloudera.com/blog/2014/09/apache-kafka-for-beginners/)
* [How Many Partitions?](http://www.confluent.io/blog/how-to-choose-the-number-of-topicspartitions-in-a-kafka-cluster/)
* [Docker](https://hub.docker.com/r/ches/kafka/)
