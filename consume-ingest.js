'use strict';

let async = require( 'async' );

let config = require( './config.json' );
let app = {
  config: config,
  log: function() {
    console.log.apply( null, arguments )
  }
};

let Q = require( './KafkaQueue' )( app );

Q.consumer.connect( 'ingest', 'relayer', function( message ) {

  let handle = message.handle;
  let msg = message.msg;

  console.log( JSON.stringify( msg ) );
  Q.consumer.commit( handle, function( err ) {
    if ( err ) console.error( 'commit error:', err );
  });
  
});

