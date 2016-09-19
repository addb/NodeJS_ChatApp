// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
//var clients = [ ]; //made it local into groups
var clients=[];
// list of chat groups
var groups = [];
//to know which user is in which group
var currentGroups=[];
/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );
var noGroup=false;
/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});
server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
	
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;
	var gName=false;
	var hdata=[];
    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
	//sendHistory(); after the client joins particular group
    /*if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }*/
    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text'
			var messagetext=message.utf8Data;
			var groupEmbededMessage;
			var parsedMes;
			if(messagetext.indexOf("$&$")>-1)
			{
			groupEmbededMessage=message.utf8Data.split("$&$"); // here we get the message with group name + $&$ + text
			console.log("group name is: "+groupEmbededMessage[0]+"!");
			gName=groupEmbededMessage[0];
			parsedMes=groupEmbededMessage[1];//.split(" ");
			//console.log("message after group name tokenized "+parsedMes);
			message.utf8Data=parsedMes;
			}
			else
			{
				parsedMes=message.utf8Data.split(" "); // to look for create, join group commands
			 }
			
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = htmlEntities(message.utf8Data);
                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName
                            + ' with ' + userColor + ' color.');

            } 
			else if(userName !== false && gName === false && noGroup === false)
			{
			if(parsedMes[0]==="create"){
				console.log((new Date()) +"Create group command received! name: "+parsedMes[1]);
				var newName=parsedMes[1];
				createGroup(newName);
				}
			else{
					connection.sendUTF(JSON.stringify({ type:'error', data:"Error: Please create a room to chat first!" }));
						console.log((new Date()) +"Error Sent: Please create a room to chat first");
					
		
				}
			}
			else if(userName !== false && gName === false && noGroup === true)
			{
				if(parsedMes[0]==="create"){
				console.log((new Date()) +"Create group command received! name: "+parsedMes[1]);
				var newName=parsedMes[1];
				createGroup(newName);
				}
				else if(parsedMes[0]==="join"){
				console.log((new Date()) +"join group request received! Groupname: "+parsedMes[1]);
				var joinGroupName = parsedMes[1];
				joinGroup(joinGroupName);
				}
				else{
					connection.sendUTF(JSON.stringify({ type:'error', data:"Error: Please create a room to chat first!" }));
						console.log((new Date()) +"Error Sent: Please create a room to chat first");
					
		
				}
			
			}
			
			else { // log and broadcast the message
				parsedMes=message.utf8Data.split(" ");
					console.log("you are here whats the value of parsedMes[0] "+parsedMes[0]+" !!!!!!!!!!!!!!!!!!!!!!");
				if(parsedMes[0] ==="create"){
					console.log((new Date()) +"Create group command received! name: "+parsedMes[1]);
					var newName=parsedMes[1];
					createGroup(newName);
					}
				else if(parsedMes[0]==="join"){
					console.log((new Date()) +"join group request received! Group name: "+parsedMes[1]);
					var joinGroupName = parsedMes[1];
					joinGroup(joinGroupName);
				}
				else
				{
                console.log((new Date()) + ' Received Message from '
                            + userName + ': ' + message.utf8Data);}
							
				// we want to keep history of all sent messages
				if(gName!== false && parsedMes[0]!=="create" && parsedMes[0]!=="join")
				{
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor,
					group:gName
                };
				//hdata.push(obj);
				logHistory(obj);
				}
                //we want all this for each room
				
               
                                //history = history.slice(-100);

                // broadcast message to all connected clients
				
                /*for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }*/
				for(var i=0;i<groups.length;i++){
				
                var json = JSON.stringify({ type:'message', data: obj });
				
					if(groups[i].groupname===gName)  // send message to only clients to the groups to which the message is sent
					{
						for(var j=0;j<groups[i].client.length;j++)
						{
								groups[i].client[j].sendUTF(json);
								console.log("sent to: "+ groups[i].groupname+" client: "+groups[i].client[j]);
						}
						break;
					}
					
				}
            }
        }
    });
	function createGroup(newName){
	//if(typeof newName =='undefined') 
				if(newName ==='' || newName===' ' || newName == null)
				{
				connection.sendUTF(JSON.stringify({ type:'error', data:"Error: Please type a proper group name!" }));
					console.log((new Date()) +"Error: Please give a name to your group");
				}
				else{
				gName=newName; //*****************group created!!
				hdata=[];
				connection.sendUTF(JSON.stringify({ type:'groupname', data:newName  }));
				 console.log((new Date()) + ' "'+gName+'" group created ');
				 
				 var Robj={
					groupname: gName,
					client: clients,
					history: hdata
				};
				groups.push(Robj);
				 noGroup=true;
				 }
	}
	function joinGroup(joinGroupName){
	//if(typeof newName =='undefined') 
	
				var groupfound=false;
			if(joinGroupName ==='' || joinGroupName===' ')
				{
				connection.sendUTF(JSON.stringify({ type:'error', data:"Error:	 Please type a proper group name!" }));
					console.log((new Date()) +"Error: Please give a name to your group");
				}
			else{
				for (var i=0; i < groups.length; i++) {
                    if(groups[i].groupname === joinGroupName)
					{
					groupfound=true;
					console.log("group found!");
					break;
					}
                }
			if(groupfound === true)
				{
					gName=joinGroupName;
					connection.sendUTF(JSON.stringify({ type:'joingroupname', data:joinGroupName  }));
					console.log((new Date()) + ' "'+gName+'" group joined ');
					sendHistory(gName); // history of that group sent// send it to only the one who joined now
					console.log((new Date()) + ' "'+gName+'" hisotry of this group sent ');
				}
				else
				{
					connection.sendUTF(JSON.stringify({ type:'error', data:"Error 200: Group does not exist!" }));
					console.log((new Date()) +"Error: Please give a name to your group");
				}
				
			}
		
	}
	function logHistory(obj)
	{
	
	for(var i=0;i<groups.length;i++)
		{	
			if(groups[i].groupname===gName)  // to find the group of connected client to add their message to its respective group history
			{
				groups[i].history.push(obj); 
				console.log("logged history of group: "+ groups[i].groupname);
				break;
			}
			
		}
	
	
	}
	function sendHistory(gName)
	{
	
		for(var i=0;i<groups.length;i++)
		{	
			if(groups[i].groupname===gName)  // send message to only clients to the groups to which the message is sent
			{
				if (groups[i].history.length >= 0) 
				{
						
						var json = JSON.stringify({ type:'history', data: groups[i].history });
						//for(var j=0;j<groups[i].client.length;j++)// donot broadcast to all
						{
						groups[i].client[index].sendUTF(json); // to send only to the client who just joined group 
						console.log("sent history to all participants of group: "+ groups[i].groupname);
						}
				}
				break;
			}
			
		}
	/*if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }*/

	}
    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });
	
});
	