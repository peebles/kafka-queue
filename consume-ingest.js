'use strict';

let async = require( 'async' );

let config = require( './config.json' );
let app = {
  config: config,
  log: function() {
    console.log.apply( null, arguments )
  }
};

let Q = require( './KafkaQueue' )( app.config.kafkaQueue );

Q.consumer.connect( 'ingest', 'relayer', function( message, cb ) {

  let handle = message.handle;
  let msg = message.msg;

  console.log( JSON.stringify( msg ) );
  cb();
});

