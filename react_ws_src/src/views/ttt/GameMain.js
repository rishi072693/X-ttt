import React, { Component } from 'react'

import io from 'socket.io-client'

import TweenMax from 'gsap'

import rand_arr_elem from '../../helpers/rand_arr_elem'
import rand_to_fro from '../../helpers/rand_to_fro'

export default class SetName extends Component {

	constructor(props) {
		super(props)

		this.win_sets = [
			['c1', 'c2', 'c3'],
			['c4', 'c5', 'c6'],
			['c7', 'c8', 'c9'],

			['c1', 'c4', 'c7'],
			['c2', 'c5', 'c8'],
			['c3', 'c6', 'c9'],

			['c1', 'c5', 'c9'],
			['c3', 'c5', 'c7']
		]


		if (this.props.game_type != 'live')
			this.state = {
				cell_vals: {},
				next_turn_ply: true,
				game_play: true,
				game_stat: 'Start game'
			}
		else {
			this.sock_start()

			this.state = {
				cell_vals: {},
				next_turn_ply: true,
				game_play: false,
				game_stat: 'Connecting',
				messages: [],
				messageInput: ''
			}
		}
	}

	//	------------------------	------------------------	------------------------

	componentDidMount() {
		TweenMax.from('#game_stat', 1, { display: 'none', opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeIn })
		TweenMax.from('#game_board', 1, { display: 'none', opacity: 0, x: -200, y: -200, scaleX: 0, scaleY: 0, ease: Power4.easeIn })
	}

	//	------------------------	------------------------	------------------------
	//	------------------------	------------------------	------------------------

	sock_start() {

		this.socket = io(app.settings.ws_conf.loc.SOCKET__io.u);

		this.socket.on('connect', function (data) {
			// console.log('socket connected', data)

			this.socket.emit('new player', { name: app.settings.curr_user.name });

		}.bind(this));

		this.socket.on('pair_players', function (data) {
			// console.log('paired with ', data)

			this.setState({
				next_turn_ply: data.mode == 'm',
				game_play: true,
				game_stat: 'Playing with ' + data.opp.name
			})

		}.bind(this));
		
		//event to handle player with same name
		this.socket.on('player_already_exist', function (data) {

			this.handleNameExists(data)

		}.bind(this));

		//Event to trigger rematch
		this.socket.on('rematch_start', function (data) {
			// Reset the game state for the rematch
			this.setState({
				cell_vals: {},           // Reset cell values (empty board)
				next_turn_ply: data.turn,     // Player 'x' goes first
				game_play: true,         // Game is active
				game_stat: 'Playing with ' + data.name // Set game status message
			});

			// Clear any winning state (if any)
			this.clearWinState();
		}.bind(this));

		//Chat event
		this.socket.on('chat_message', (msg) => {
			this.setState((prevState) => ({ messages: [...prevState.messages, msg] }));
		});
		
		//chatevent error
		this.socket.on('chat_error', (msg) => {
			alert(msg)
		});


		this.socket.on('opp_turn', this.turn_opp_live.bind(this));



	}

	//	------------------------	------------------------	------------------------
	//	------------------------	------------------------	------------------------

	componentWillUnmount() {

		this.socket && this.socket.disconnect();
	}

	//	------------------------	------------------------	------------------------

	cell_cont(c) {
		const { cell_vals } = this.state

		return (<div>
			{cell_vals && cell_vals[c] == 'x' && <i className="fa fa-times fa-5x"></i>}
			{cell_vals && cell_vals[c] == 'o' && <i className="fa fa-circle-o fa-5x"></i>}
		</div>)
	}

	//Function to send message and trigger messsage event
	sendMessage() {
		const { messageInput } = this.state;
		if (messageInput.trim()) {
			this.socket.emit('chat_message', messageInput);
			this.setState((prevState) => ({ messages: [...prevState.messages, { from: 'You: ', text: messageInput, timestamp: new Date().toISOString() }], messageInput: '' }));
		}
	};

	//	------------------------	------------------------	------------------------

	render() {
		const { cell_vals } = this.state
		// console.log(cell_vals)

		return (
			<div id='GameContainer' style={{ display: 'flex', justifyContent: 'center', alignItems: 'centre', gap: '40px', padding: '20px' }}>
				<div id='GameMain' className='w-2/3 p-4' style={{ textAlign: 'center', justifyContent: 'center' }}>

					<h1>Play {this.props.game_type}</h1>

					<div id="game_stat">
						<div id="game_stat_msg">{this.state.game_stat}</div>
						{this.state.game_play && <div id="game_turn_msg">{this.state.next_turn_ply ? 'Your turn' : 'Opponent turn'}</div>}
					</div>

					<div id="game_board">
						<table>
							<tbody>
								<tr>
									<td id='game_board-c1' ref='c1' onClick={this.click_cell.bind(this)}> {this.cell_cont('c1')} </td>
									<td id='game_board-c2' ref='c2' onClick={this.click_cell.bind(this)} className="vbrd"> {this.cell_cont('c2')} </td>
									<td id='game_board-c3' ref='c3' onClick={this.click_cell.bind(this)}> {this.cell_cont('c3')} </td>
								</tr>
								<tr>
									<td id='game_board-c4' ref='c4' onClick={this.click_cell.bind(this)} className="hbrd"> {this.cell_cont('c4')} </td>
									<td id='game_board-c5' ref='c5' onClick={this.click_cell.bind(this)} className="vbrd hbrd"> {this.cell_cont('c5')} </td>
									<td id='game_board-c6' ref='c6' onClick={this.click_cell.bind(this)} className="hbrd"> {this.cell_cont('c6')} </td>
								</tr>
								<tr>
									<td id='game_board-c7' ref='c7' onClick={this.click_cell.bind(this)}> {this.cell_cont('c7')} </td>
									<td id='game_board-c8' ref='c8' onClick={this.click_cell.bind(this)} className="vbrd"> {this.cell_cont('c8')} </td>
									<td id='game_board-c9' ref='c9' onClick={this.click_cell.bind(this)}> {this.cell_cont('c9')} </td>
								</tr>
							</tbody>
						</table>
					</div>
					{/* <button onClick={this.reset.bind(this)}>reset</button> */}

					<button type='submit' onClick={this.end_game.bind(this)} className='button'><span>End Game <span className='fa fa-caret-right'></span></span></button>
					&nbsp;
					&nbsp;
					&nbsp;
					{this.props.game_type == 'live' ? <button type='submit' onClick={this.handleRematch.bind(this)} className='button'><span>Rematch <span className='fa fa-caret-right'></span></span></button> : null}

				</div>
				{this.props.game_type == 'live' ?<div id='ChatBox' style={{ width: '300px', border: '1px solid #ccc', padding: '15px', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
					<h2>Chat</h2>
					<div className='chat-messages h-64 overflow-auto border p-2'>
						{Array.isArray(this.state.messages) && this.state.messages.length > 0 ? this.state.messages.map((msg, index) => (
							<div key={index} className='p-1'>{`${msg.from}:${msg.text}`}</div>
						)) : null}
					</div>
					<div className='chat-input mt-2'>
						<input
							type='text'
							value={this.state.messageInput}
							onChange={(e) => this.setState({ messageInput: e.target.value })}
							className='border p-1 w-full'
						/>
						<button onClick={this.sendMessage.bind(this)} className='button mt-1 w-full'>Send</button>
					</div>
				</div>:null}
			</div>
		)
	}

	handleNameExists(data) {
		console.log(data)
		this.socket.disconnect();
		alert(data)
		app.settings.curr_user = {}
		this.props.onSetType(null)
	}
	//	------------------------	------------------------	------------------------
	//	------------------------	------------------------	------------------------

	click_cell(e) {
		// console.log(e.currentTarget.id.substr(11))
		// console.log(e.currentTarget)

		if (!this.state.next_turn_ply || !this.state.game_play) return

		const cell_id = e.currentTarget.id.substr(11)
		if (this.state.cell_vals[cell_id]) return

		if (this.props.game_type != 'live')
			this.turn_ply_comp(cell_id)
		else
			this.turn_ply_live(cell_id)
	}

	//	------------------------	------------------------	------------------------
	//	------------------------	------------------------	------------------------

	turn_ply_comp(cell_id) {

		let { cell_vals } = this.state

		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })


		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: false
		// })

		// setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

	//	------------------------	------------------------	------------------------

	turn_comp() {

		let { cell_vals } = this.state
		let empty_cells_arr = []


		for (let i = 1; i <= 9; i++)
			!cell_vals['c' + i] && empty_cells_arr.push('c' + i)
		// console.log(cell_vals, empty_cells_arr, rand_arr_elem(empty_cells_arr))

		const c = rand_arr_elem(empty_cells_arr)
		cell_vals[c] = 'o'

		TweenMax.from(this.refs[c], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })


		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: true
		// })

		this.state.cell_vals = cell_vals

		this.check_turn()
	}


	//	------------------------	------------------------	------------------------
	//	------------------------	------------------------	------------------------

	turn_ply_live(cell_id) {

		let { cell_vals } = this.state

		cell_vals[cell_id] = 'x'

		TweenMax.from(this.refs[cell_id], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })

		this.socket.emit('ply_turn', { cell_id: cell_id });

		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: false
		// })

		// setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

	//	------------------------	------------------------	------------------------

	turn_opp_live(data) {

		let { cell_vals } = this.state
		let empty_cells_arr = []


		const c = data.cell_id
		cell_vals[c] = 'o'

		TweenMax.from(this.refs[c], 0.7, { opacity: 0, scaleX: 0, scaleY: 0, ease: Power4.easeOut })


		// this.setState({
		// 	cell_vals: cell_vals,
		// 	next_turn_ply: true
		// })

		this.state.cell_vals = cell_vals

		this.check_turn()
	}

	//	------------------------	------------------------	------------------------
	//	------------------------	------------------------	------------------------
	//	------------------------	------------------------	------------------------

	check_turn() {

		const { cell_vals } = this.state

		let win = false
		let set
		let fin = true

		if (this.props.game_type != 'live')
			this.state.game_stat = 'Play'


		for (let i = 0; !win && i < this.win_sets.length; i++) {
			set = this.win_sets[i]
			if (cell_vals[set[0]] && cell_vals[set[0]] == cell_vals[set[1]] && cell_vals[set[0]] == cell_vals[set[2]])
				win = true
		}


		for (let i = 1; i <= 9; i++)
			!cell_vals['c' + i] && (fin = false)

		// win && console.log('win set: ', set)

		if (win) {

			this.refs[set[0]].classList.add('win')
			this.refs[set[1]].classList.add('win')
			this.refs[set[2]].classList.add('win')

			TweenMax.killAll(true)
			TweenMax.from('td.win', 1, { opacity: 0, ease: Linear.easeIn })

			this.setState({
				game_stat: (cell_vals[set[0]] == 'x' ? 'You' : 'Opponent') + ' win',
				game_play: false
			})

			//this.socket && this.socket.disconnect();

		} else if (fin) {

			this.setState({
				game_stat: 'Draw',
				game_play: false
			})

			//this.socket && this.socket.disconnect();

		} else {
			this.props.game_type != 'live' && this.state.next_turn_ply && setTimeout(this.turn_comp.bind(this), rand_to_fro(500, 1000));

			this.setState({
				next_turn_ply: !this.state.next_turn_ply
			})
		}

	}

	//	------------------------	------------------------	------------------------

	end_game() {
		this.socket && this.socket.disconnect();

		this.props.onEndGame()
	}
	
	//handler for rematch click
	handleRematch() {
		this.socket.emit('rematch', {});
	}

	
	// Remove the 'win' class from all cells
	clearWinState() {
		const cells = document.querySelectorAll('td');
		cells.forEach(cell => {
			cell.classList.remove('win');
		});
	}





}
