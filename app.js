/*************************************************************************************************
 * 
 * THE TANK GAME
 * Tim Vande Walle
 * 
 * inspired by 
 *      Sven Bergström      - http://buildnewgames.com/real-time-multiplayer/
 *      Gabriel Gambetta    - http://www.gabrielgambetta.com/client-server-game-architecture.html
 *  
**************************************************************************************************/
/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    
    written by : http://underscorediscovery.ca
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.

    Usage : node app.js
*/


/***************************************************
 * 
 * CONFIG
 * 
****************************************************/
var config = {};
config.port = process.env.PORT || 7007;
config.isDebug = true;


/***************************************************
 * 
 * INIT
 * 
****************************************************/
print("init");

var io = require('socket.io');
var express = require('express');
var UUID = require('node-uuid');
var http = require('http');
var app = express();
var server = http.createServer(app);
      

/***************************************************
 * 
 * WEB SERVER 
 * 
****************************************************/
server.listen(config.port);
print("server started at port " + config.port);

app.get( '/', function( req, res ){
    res.sendfile( '/index.html' , { root:__dirname });
});

app.get( '/*' , function( req, res, next ) {
    var file = req.params[0];    
    res.sendfile( __dirname + '/' + file );    
}); 


/***************************************************
 * 
 * SOCKET 
 * 
****************************************************/
//Express and socket.io can work together to serve the socket.io client files for you.
//This way, when the client requests '/socket.io/' files, socket.io determines what the client needs.

//Create a socket.io instance using our express server
var socket = io.listen(server);

//Configure the socket.io connection settings.
//See http://socket.io/
socket.configure(function (){    
    socket.set('log level', 0);

    socket.set('authorization', function (handshakeData, callback) {
        callback(null, true); // error first callback style
    });

});

//Enter the game server code. The game server handles
//client connections looking for a game, creating games,
//leaving games, joining games and ending games when they leave.
game_server = require('./game.server.js');

//Socket.io will call this function when a client connects,
//So we can send that client looking for a game to play,
//as well as give that client a unique ID to use so we can
//maintain the list if players.
socket.sockets.on('connection', function (client) {

    //Generate a new UUID, looks something like
    //5b2ca132-64bd-4513-99da-90e838ca47d1
    //and store this on their socket/connection
    client.userid = UUID();

    //tell the player they connected, giving them their id and overview of the existing games
    client.emit('onconnected', { id: client.userid } );

    gameRooms = game_server.getGameRooms(client);
    client.emit('ongamesoverview', { gameRooms: gameRooms})
    //game_server.sendGameRooms(client);

    //now we can find them a game to play with someone.
    //if no game exists with someone waiting, they create one and wait.
    //game_server.findGame(client);

    //Useful to know when someone connects
    print('\t socket:: player ' + client.userid + ' connected');

    //Now we want to handle some of the messages that clients will send.
    //They send messages here, and we send them to the game_server to handle.
    client.on('message', function(m) {
        game_server.onMessage(client, m);
    }); //client.on message

    //When this client disconnects, we want to tell the game server
    //about that as well, so it can remove them from the game they are
    //in, and make sure the other player knows that they left and so on.
    client.on('disconnect', function () {
        //Useful to know when soomeone disconnects
        print('\t socket:: client disconnected ' + client.userid + ' ' + client.game_id);
        
        //If the client was in a game, set by game_server.findGame,
        //we can tell the game server to update that game state.
        if(client.game && client.game.id) {

            //player leaving a game should destroy that game
            game_server.endGame(client.game.id, client.userid);

        } //client.game_id

    }); //client.on disconnect
 
}); //sio.sockets.on connection






/************************************
 * 
 * FUNCTIONS
 * 
*************************************/
function print(txt){
    console.log(txt);
}

function debug(txt){
    if(config.isDebug){
        print(txt);
    }
}
