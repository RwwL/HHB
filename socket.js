var ws = require("websocket-server");
var constants = require("./constants.js");
var server = ws.createServer({"debug": true});

var boardId = null,
    players = [];

function addPlayer(id){
    if (players.indexOf(id)>-1){ return; }
    players.push(id);
    informBoard(constants.PLAYERS_CHANGED_MSG);
    informAllPlayers(constants.PLAYERS_CHANGED_MSG);
}

function removePlayer(id) {
    var idx = players.indexOf(id);
    if (idx<0) { return; }
    players.splice(idx,1);
    informBoard(constants.PLAYERS_CHANGED_MSG);
    informAllPlayers(constants.PLAYERS_CHANGED_MSG);
}

function addGameboard(id) {
    boardId = id;
    informBoard(constants.BOARD_JOINED_MSG);
    informAllPlayers(constants.BOARD_JOINED_MSG);
}

function removeGameboard() {
    boardId = null;
    informAllPlayers(constants.BOARD_LEFT_MSG);
}

function isGameReady() {
    return (players.length >= constants.MIN_PLAYERS && boardId != null);
}

function sendMessage(id, msg){
    server.send(id, msg);
}

function informPlayer(id, msg) {
    sendMessage(id, '{"message": "' + message + '", "ready" : ' +  isGameReady().toString() + ' }');
}
    
function informAllPlayers(message) {
    for (var i=players.length-1;i>-1;i--) {
        sendMessage(players[i], '{"message": "' + message + '", "ready" : ' +  isGameReady().toString() + ' }');
    }
}

function informBoard(message) {
     sendMessage(boardId, '{"message" : "'+ message +'", "players" : [' + players.join(",") +'], "ready": ' + isGameReady().toString() + ' }');
}

function makePlay(id, play){
    server.send(boardId, '{"player" : "' + id + '", "message" : "' + play + '", "ready": ' + isGameReady().toString() + ' }');
}

function processMsg(connection, msg) {
    if (msg.messageType == constants.BOARD_JOINED_MSG) {
        if (boardId != null) {
            connection.send('{"message":"Gameboard already exists. Try back later"}');
            connection.close();
            return;
        }
        addGameboard(connection.id);
        return;
    }
    
    if (msg.messageType == constants.PLAYER_JOINED_MSG) {
        if (players.length >= constants.MAX_PLAYERS ) {
            connection.send('{"message":"Max number of players reached. Try back later"}');
            connection.close();
            return;
        }
        addPlayer(connection.id);
        return;
    }
    
    if (msg.clientType == constants.CLIENT_TYPE_BOARD) {
        if (msg.messageType == constants.ANNOUNCEMENT_MSG) {
            informAllPlayers(msg.message);
        }
        if (msg.messageType == constants.PLAYER_PRIVATE_MSG) {
            informPlayer(msg.target, msg.message);
        }
        return;
    }
    
    if (msg.clientType == constants.CLIENT_TYPE_PLAYER) {
        if (msg.messageType == constants.PLAY_MADE_MSG) {
            makePlay(connection.id, msg.message);
        }
    }
}

server.addListener("connection", function(connection){
    connection.addListener("message", function(msg){
        processMsg(connection,  JSON.parse(msg)); 
    });
    connection.addListener("close", function(){
        if (connection.id == boardId) { removeGameboard(); return; }   
        removePlayer(connection.id);
    });
    connection.send('{"id":"'+ connection.id +'","message": "' + constants.WELCOME_MSG + '"}');
});

server.listen(1066);