

// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------	

// New player has joined
function onNewPlayer(data) {

	util.log("New player has joined: "+data.name);

	//Check if player already exists
	let exists=false
	if(playerAlreadyExist(data)){
		util.log("Player already exists");
		exists = true
	}

	// Create a new player
	var newPlayer = new Player(-1, data.name, "looking");
	newPlayer.sockid = this.id;

	this.player = newPlayer;

	// Add new player to the players array
	players.push(newPlayer);
	players_avail.push(newPlayer);

	// util.log("looking for pair - uid:"+newPlayer.uid + " ("+newPlayer.name + ")");
	//Event for player already exists
	if(exists){
		emitPlayerAlreadyExist(this.id,data.name)
		return
	}

	pair_avail_players();

	// updAdmin("looking for pair - uid:"+p.uid + " ("+p.name + ")");

	// updAdmin("new player connected - uid:"+data.uid + " - "+data.name);

};

//Function to check if player already exists
function playerAlreadyExist (newPlayerData) {
	if(players.length > 0) {
		let sameNamePlayers = players.filter((player) => player.name == newPlayerData.name) 
		if(sameNamePlayers.length > 0) {
			return true
		}
	}
	return false
}

function emitPlayerAlreadyExist(playerSockId,playerName){
	io.to(playerSockId).emit("player_already_exist", `player already exist with ${playerName} please change the name`)
}

// ----	--------------------------------------------	--------------------------------------------	

function pair_avail_players() {

	if (players_avail.length < 2)
		return;


	var p1 = players_avail.shift();
	var p2 = players_avail.shift();

	p1.mode = 'm';
	p2.mode = 's';
	p1.status = 'paired';
	p2.status = 'paired';
	p1.opp = p2;
	p2.opp = p1;

	//util.log("connect_new_players p1: "+util.inspect(p1, { showHidden: true, depth: 3, colors: true }));

	// io.sockets.connected[p1.sockid].emit("pair_players", {opp: {name:p2.name, uid:p2.uid}, mode:'m'});
	// io.sockets.connected[p2.sockid].emit("pair_players", {opp: {name:p1.name, uid:p1.uid}, mode:'s'});
	io.to(p1.sockid).emit("pair_players", {opp: {name:p2.name, uid:p2.uid}, mode:'m'});
	io.to(p2.sockid).emit("pair_players", {opp: {name:p1.name, uid:p1.uid}, mode:'s'});

	util.log("connect_new_players - uidM:"+p1.uid + " ("+p1.name + ")  ++  uidS: "+p2.uid + " ("+p2.name+")");
	// updAdmin("connect_new_players - uidM:"+p1.uid + " ("+p1.name + ")  ++  uidS: "+p2.uid + " ("+p2.name+")");

};

// ----	--------------------------------------------	--------------------------------------------	

function onTurn(data) {
	//util.log("onGameLoadedS with qgid: "+data.qgid);

	io.to(this.player.opp.sockid).emit("opp_turn", {cell_id: data.cell_id});

	util.log("turn  --  usr:"+this.player.mode + " - :"+this.player.name + "  --  cell_id:"+data.cell_id);
	// updAdmin("Q answer - game - qgid:"+data.qgid + "  --  usr:"+this.player.mode + " - uid:"+this.player.uid + "  --  qnum:"+data.qnum + "  --  ans:"+data.ansnum);
};

//Function to handle rematch
function onRematch(data) {
	io.to(this.player.sockid).emit('rematch_start',{"name":this.player.opp.name,"turn":true});
	io.to(this.player.opp.sockid).emit('rematch_start',{"name":this.player.name,"turn":false});
}
// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------	

// Socket client has disconnected
function onClientDisconnect() {
	// util.log("onClientDisconnect: "+this.id);


	var removePlayer = this.player;
	players.splice(players.indexOf(removePlayer), 1);
	players_avail.splice(players_avail.indexOf(removePlayer), 1);


	if (this.status == "admin") {
		util.log("Admin has disconnected: "+this.uid);
//		updAdmin("Admin has disconnected - uid:"+this.uid + "  --  "+this.name);
	} else {
		util.log("Player has disconnected: "+this.id);
//		updAdmin("player disconnected - uid:"+removePlayer.uid + "  --  "+removePlayer.name);
	}

};

// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------	

// ----	--------------------------------------------	--------------------------------------------	
// ----	--------------------------------------------	--------------------------------------------

function onChatMessage(data) {
    if (!this.player || !this.player.opp) {
        io.to(this.id).emit("chat_error", "You must be paired with an opponent to chat.");
        return;
    }

    const message = {
        from: this.player.name,
        text: data,
        timestamp: new Date().toISOString()
    };

    // Send message to both players in the match
    //io.to(this.player.sockid).emit("chat_message", message);
    io.to(this.player.opp.sockid).emit("chat_message", message);

    util.log(`Chat: ${this.player.name} -> ${this.player.opp.name}: ${data}`);
}

set_game_sock_handlers = function (socket) {

	// util.log("New game player has connected: "+socket.id);

	socket.on("new player", onNewPlayer);

	socket.on("ply_turn", onTurn);

	socket.on("disconnect", onClientDisconnect);

	socket.on('rematch', onRematch);
	
	socket.on('chat_message', onChatMessage);

};
