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

let count = 100;

let deviceIds = {
  '1001': 1,
  '2002': 1,
  '3003': 1,
};

Q.producer.connect( function( err ) {
  if ( err ) exit( err );
  start();
});

function exit( err ) {
  if ( err ) console.error( 'exit:', err );
  process.exit( err ? 1 : 0 );
}

function start() {
  console.log( 'starting send ...' );
  async.parallel([
    function( cb ) {
      send_traffic( '1001', cb );
    },
    function( cb ) {
      send_traffic( '2002', cb );
    },
    function( cb ) {
      send_traffic( '3003', cb );
    },
  ], function( err ) {
    exit( err );
  });
}

function send_traffic( key, cb ) {
  var iter = 1;
  async.whilst(
    function() { return ( iter <= count ); },
    function( cb ) {
      let m = { deviceId: key, seq: deviceIds[ key ] };
      Q.producer.send( 'ingest', m, function( err ) {
	if ( err ) console.error( err );
        console.log( 'sent:', m );
        deviceIds[ key ] += 1;
        iter += 1;
        setTimeout( function() {
          cb();
        }, 500 + ( ( Math.floor(Math.random() * 6) + 1 ) * 100 ) );
      });
    },
    function( err ) {
      cb( err );
    });
}


