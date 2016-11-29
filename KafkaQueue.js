'use strict';

let Kafka = require('no-kafka');
let _ = require( 'lodash' );
let Hashring = require( 'hashring' );
let Promise = require('bluebird');

module.exports = function( config ) {

  class KafkaProducer {
    constructor() {
      // copy global kafka config
      this.config = _.cloneDeep( config );

      // producer partitioner.  map message keys to partition numbers, based on the
      // number of available partitions.
      this.config.partitioner = ( topic, parts, message ) => {
	if ( ! this.hashring )
	  this.hashring = new Hashring( parts.map( function( p ) { return p.partitionId.toString(); } ) );
	return Number( this.hashring.get( message.key ) );
      }

      this.producer = new Kafka.Producer( this.config );
    }

    connect( cb ) {
      this.producer.init().then( () => {
	cb();
      }).catch( (err) => {
	cb( err );
      });
    }

    send( queue, message, cb ) {
      let m = {
	key: message[ this.config.keyField ],
	value: JSON.stringify( message )
      };
      this.producer.send({ topic: queue, message: m }).then( () => {
	cb();
      }).catch( (err) => {
	cb( err );
      });
    }
  }

  class KafkaConsumer {
    constructor() {
      // copy global kafka config
      this.config = _.cloneDeep( config );
    }

    connect( queue, groupId, messageHandler ) {
      this.config.groupId = groupId;
      this.consumer = new Kafka.GroupConsumer( this.config );

      let dataHandler = ( messages, topic, partition ) => {
	return Promise.each( messages, ( m ) => {
	  let handle = {topic: topic, partition: partition, offset: m.offset, metadata: 'optional'};
	  let message = JSON.parse( m.message.value.toString('utf8') );
	  return new Promise( ( resolve, reject ) => {
	    messageHandler({ handle: handle, msg: message }, ( err ) => {
	      if ( err ) return reject( err );
	      this.consumer.commitOffset( handle ).then( () => {
		resolve();
	      }).catch( (err) => {
		reject( err );
	      });
	    });
	  });
	});
      }

      let strategies = [{
	strategy: 'TestStrategy',
	subscriptions: [ queue ],
	handler: dataHandler
      }];

      this.consumer.init(strategies);
    }

    commit( handle, cb ) {
      this.consumer.commitOffset( handle ).then( () => {
	cb();
      }).catch( (err) => {
	cb( err );
      });
    }
  }

  return {
    producer: new KafkaProducer(),
    consumer: new KafkaConsumer()
  };
}
