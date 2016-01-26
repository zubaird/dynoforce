'use strict';
/* global cordova */
/* global device */

angular.module('dynoforceApp')
.constant('socketPort', 1337)
.factory('webSocketServer', ['socketPort', function(socketPort) {

  return {
    wsserver: cordova.plugins.wsserver,

    /* Start a websocket server to host a game on the default port */
    start: function(onStart) {
      console.log('starting server');

      /* host-facing methods */

      this.wsserver.start(socketPort, {
        'onStart': function(addr, port) {
          onStart(addr, port);
          console.log('Listening on %s:%d', addr, port);
        },
        'onStop': function(addr, port) {
          console.log('Stopped listening on %s:%d', addr, port);
        },
        'onOpen': function(conn) {
          console.log('A user connected from %s', conn.remoteAddr);
        },
        'onMessage': function(conn, msg) {
          console.log(conn, msg);
          console.log('MSG');
          var json = JSON.parse(msg);
          console.log(json.message);
          alert(json.message);
        },
        'onClose': function(conn) {
          console.log('A user disconnected from %s', conn.remoteAddr);
        },
        'protocols': ['json']
      });
    },

    stop: function() {
      this.wsserver.stop();
    },

    sendToPlayer: function(uuid, message) {
      this.wsserver.send({
        'uuid': uuid
      }, message);
    },

    removePlayer: function(uuid) {
      this.wsserver.close({
        'uuid': uuid
      });
    },

    /* player-facing methods */

    joinHost: function(addr) {
      console.log('joinHost: ' + addr);
      var ws = new WebSocket('ws://' + addr + ':' + socketPort, ['json']);
      ws.onopen = function() {
        var message = JSON.stringify({
          'message': 'connect'
        });
        ws.send(message);
      };
    }
  };

    // conn: {
    // 'uuid' : '8e176b14-a1af-70a7-3e3d-8b341977a16e',
    // 'remoteAddr' : '192.168.1.10',
    // 'acceptedProtocol' : 'my-protocol-v1',
    // 'httpFields' : {...}
    // }

    //create a new WebSocket object.
    // websocket = new WebSocket('ws://localhost:9000/daemon.php'); 
    // websocket.onopen = function(evt) { /* do stuff */ }; //on open event
    // websocket.onclose = function(evt) { /* do stuff */ }; //on close event
    // websocket.onmessage = function(evt) { /* do stuff */ }; //on message event
    // websocket.onerror = function(evt) { /* do stuff */ }; //on error event
    // websocket.send(message); //send method
    // websocket.close(); //close method

  }])
.factory('zeroConf', ['nameGen', function(nameGen) {

  return {

    zc:  cordova.plugins.zeroconf,

    register: function(role, watcher) {
      if (role !== 'host' && role !== 'player') {
        throw new Error('zeroConf - unknown role: ' + role);
      }

      this.zc.register('_http._tcp.local.', 'DynoForce-' + device.model + '-' + device.uuid, 80, {
        'id': 'DynoForce',
        'role': role,
        'mech': nameGen.getMechName(),
        'pilot': nameGen.getPilotName()
      });

      this.zc.watch('_http._tcp.local', function(result) {
        var action = result.action;
        var zcservice = result.service;

        if (action === 'added' &&
          zcservice.txtRecord.id === 'DynoForce' &&
          zcservice.txtRecord.role === 'host') {

          watcher(zcservice);
      } 
      else if (action === 'removed') {
        console.log('REMOVED: ');
        console.log(zcservice);
      }
    });
    },

    stop: function() {
      this.zc.stop();
    }
  };
}]);
