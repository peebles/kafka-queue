'use strict';

let async = require( 'async' );

let stack = process.argv[2];

if ( ! stack ) {
  console.log( 'usage: node pipeline.js [staging|prod]' );
  process.exit(1);
}

let config = require( './config.json' );
let app = {
  config: config,
  log: function() {
    console.log.apply( null, arguments )
  }
};

let Q = require( './KafkaQueue' )( app.config.kafkaQueue );

Q.consumer.connect( stack, stack+'pipeline', function( message, cb ) {

  let handle = message.handle;
  let msg = message.msg;

  console.log( JSON.stringify( msg ) );
  cb();
});

