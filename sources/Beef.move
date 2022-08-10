/// Create bets between 2 or more players. Includes escrow and voting functionality.
module beef::bet {

	use std::vector;
	use sui::coin::{Self, Coin};
	use sui::object::{Self, Info};
	use sui::transfer;
	use sui::tx_context::{Self, TxContext};
	use sui::utf8::{Self, String};
	use sui::vec_map::{Self, VecMap};

	/* Errors */

	// create()
	const E_JUDGES_CANT_BE_PLAYERS: u64 = 0;
	const E_ADMIN_CANT_BE_PLAYER: u64 = 1;
	const E_NOT_ENOUGH_PLAYERS: u64 = 2;
	const E_NOT_ENOUGH_JUDGES: u64 = 3;
	const E_TOO_MANY_PLAYERS: u64 = 4;
	const E_TOO_MANY_JUDGES: u64 = 5;
	const E_INVALID_QUORUM: u64 = 6;

	// fund()
	const E_ONLY_PLAYERS_CAN_FUND: u64 = 100;
	const E_ALREADY_FUNDED: u64 = 101;
	const E_FUNDS_BELOW_BET_SIZE: u64 = 102;

	// vote()
	const E_ONLY_JUDGES_CAN_VOTE: u64 = 200;
	const E_ALREADY_VOTED: u64 = 201;

	// Bet.status possible values
	const STATUS_FUND: u8 = 0;
	const STATUS_VOTE: u8 = 1;

	struct Bet<phantom T> has key, store {
		info: Info,
		status: u8,
		title: String,
		quorum: u8,
		bet_size: u64,
		admin: address,
		players: vector<address>,
		judges: vector<address>,
		votes: VecMap<address, address>, // <judge_addr,  player_addr>
		funds: VecMap<address, Coin<T>>, // <player_addr, player_funds>

		// Maybe:
		// start_epoch: Option<u64>, // voting starts on this day
		// end_epoch: Option<u64>, // voting ends on this day
		// funds: vector<Item>, // prize can be any asset(s)
		// winner: address, // record winner for posterity? or simply destroy Bet when winner is found?
		// description: String,
	}

	/// Anybody can define a new bet
	public entry fun create<T>(title: vector<u8>, quorum: u8, bet_size: u64,
			players: vector<address>, judges: vector<address>, ctx: &mut TxContext) {
		// TODO: validate inputs
		let bet = Bet<T> {
			info: object::new(ctx),
			status: STATUS_FUND,
			title: utf8::string_unsafe(title),
			quorum: quorum,
			bet_size: bet_size,
			admin: tx_context::sender(ctx),
			players: players,
			judges: judges,
			votes: vec_map::empty(),
			funds: vec_map::empty(),
		};
		transfer::share_object(bet);
	}

	/// Player locks funds for the bet
	public entry fun fund(ctx: &mut TxContext) {

	}

	/// Judges can cast a vote for one of the player addresses
	public entry fun vote(_ctx: &mut TxContext) {

	}

	/// Some scenarios where we might want to cancel the bet and refund the players:
	/// - If there's no funding, the bet admin may cancel it at any time.
	/// - If after the last vote there is no quorum, the bet automatically cancels.
	/// - If end_epoch is reached without a quorum, any participant can cancel the bet.
	/// - If the players both agree on cancelling the bet (adds complexity).
	public entry fun cancel(_ctx: &mut TxContext) {

	}

	// public entry fun destroy(_ctx: &mut TxContext) {}

	/* Specs */

	spec create {
		// pragma aborts_if_is_strict;
		// aborts_if n >= 100;
	}

	/* Tests */
}
