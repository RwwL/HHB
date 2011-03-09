var exports = {};// for node.js compatibility 

SocketClient = function(clientType, socketAddress)  {
    
    this.socketAddress  = socketAddress;
    this.clientType     = clientType;
    this.socket         = new WebSocket(socketAddress);
    this.id             = null;
    this.listeners      = [];
    
    var ref = this;
    
    this.socket.onopen = function() {    
        console.log("Socket has been opened at " + ref.socketAddress);
    }
   
    this.socket.onclose = function() {   
        console.log("Socket has been closed at " + ref.socketAddress);
        ref.resetListeners();
    }

    this.socket.onmessage = function(event){
        ref.handleMessage(JSON.parse(event.data))	
    }
}

SocketClient.prototype.handleMessage = function (msg) {
    if (msg.message == exports.WELCOME_MSG ) {
	    this.id = msg.id;
	    this.sendMessage( (this.clientType == exports.CLIENT_TYPE_BOARD) ? exports.BOARD_JOINED_MSG : exports.PLAYER_JOINED_MSG , exports.HANDSHAKE_MSG);
	    return;
	}
    	
	for (var i=0, len = this.listeners.length; i<len; i++) {
	    this.listeners[i](msg);
	}
}
    
SocketClient.prototype.resetListeners = function (){
     this.listeners = [];
}

SocketClient.prototype.sendMessage = function(messageType, message, target) {
    var tgt = target || ""; 
    this.socket.send('{ "clientType" : "' + this.clientType + '", "messageType" : "' + messageType + '",  "message" : "' + message + '", "target" : "' + tgt +'" }');
};

SocketClient.prototype.listen = function(handler) {
    if ( this.listeners.indexOf(handler<0) ) { this.listeners.push(handler); }
};

SocketClient.prototype.ignore = function (handler) {
    for (var i = this.listeners.length-1; i>-1; i--) { 
         this.listeners.splice(i,1);
         return;
   }
}