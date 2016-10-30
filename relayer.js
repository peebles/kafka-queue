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

function exit( err ) {
  if ( err ) console.error( err );
  process.exit( err ? 1 : 0 );
}

// consumer reads from 'ingest' and dups message to 'staging' and 'prod'
Q.producer.connect( function( err ) {
  if ( err ) exit( err );
  start();
});

function start() {
  Q.consumer.connect( 'ingest', 'relayer', function( message ) {

    let handle = message.handle;
    let msg = message.msg;
    
    console.log( JSON.stringify( msg ) );

    async.each( [ 'staging', 'prod' ], function( queue, cb ) {

      Q.producer.send( queue, msg, cb );
      
    }, function( err ) {
      if ( err ) console.error( err );
      Q.consumer.commit( handle, function( err ) {
	if ( err ) console.error( 'commit error:', err );
      });
    });
    
  });
}


