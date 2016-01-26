'use strict';
/* global cordova */
/* global device */

angular.module('dynoforceApp')
.constant('socketPort', 1337)
.factory('webSocketServer', ['socketPort', function(socketPort) {

  return {
    wsserver: cordova.plugins.wsserver,

    /* host-facing methods */

    /* Start a websocket server to host a game on the default port */
    start: function(events) {
      console.log('starting server');

      events.protocols = ['json'];
      this.wsserver.start(socketPort, events);
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
.factory('zeroConf', [function() {

  return {
    zc:  cordova.plugins.zeroconf,

    /* Register a game server host on the local network. */
    registerHost: function(mechName, watcher) {
      this._register({id: 'DynoForce', role: 'host', mech: mechName}, watcher);
    },

    /* Register as a potential player on the local network. */
    registerPlayer: function(pilotName, watcher) {
      this._register({id: 'DynoForce', role: 'player', pilot: pilotName}, watcher);
    },

    _register: function(data, watcher) {
      this.zc.register('_http._tcp.local.', 'DynoForce-' + device.model + '-' + device.uuid, 80, data);

      this.zc.watch('_http._tcp.local', function(result) {
        var action = result.action;
        var text = result.service.txtRecord;

        if (action === 'added' && text.id === 'DynoForce' && text.role === 'host') {
          watcher(result.service);
        } 
        else if (action === 'removed') {
          console.log('REMOVED: ');
          console.log(result.service);
        }
      });
    },

    stop: function() {
      this.zc.stop();
    }
  };
}]);
