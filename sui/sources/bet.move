/*
   ___  ___ _____   ___ ___ ___ ___   ___
  / __|/ _ \_   _| | _ ) __| __| __| | __\
 | (_ | (_) || |   | _ \ _|| _|| _|    /_/
  \___|\___/ |_|   |___/___|___|_|    (_)
                   by @juzybits
*/

/// Create bets between 2 or more players. Includes escrow and voting functionality.
module gotbeef::bet
{
    use std::option::{Self, Option};
    use std::string::{String, utf8};
    use std::vector;
    use sui::coin::{Self, Coin};
    use sui::display;
    use sui::event;
    use sui::object::{Self, ID, UID};
    use sui::package;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::vec_map::{Self, VecMap};
    use gotbeef::transfers;
    use gotbeef::vec_maps;
    use gotbeef::vectors;

    /* Errors */

    // create()
    const E_JUDGES_CANT_BE_PLAYERS: u64 = 0;
    const E_INVALID_NUMBER_OF_PLAYERS: u64 = 2;
    const E_INVALID_NUMBER_OF_JUDGES: u64 = 3;
    const E_DUPLICATE_PLAYERS: u64 = 4;
    const E_DUPLICATE_JUDGES: u64 = 5;
    const E_INVALID_QUORUM: u64 = 6;
    const E_INVALID_BET_SIZE: u64 = 7;

    // fund()
    const E_ONLY_PLAYERS_CAN_FUND: u64 = 100;
    const E_ALREADY_FUNDED: u64 = 101;
    const E_FUNDS_BELOW_BET_SIZE: u64 = 102;
    const E_NOT_IN_FUNDING_PHASE: u64 = 103;

    // vote()
    const E_NOT_IN_VOTING_PHASE: u64 = 200;
    const E_ONLY_JUDGES_CAN_VOTE: u64 = 201;
    const E_ALREADY_VOTED: u64 = 202; // (maybe: allow judges to update their vote)
    const E_PLAYER_NOT_FOUND: u64 = 203;

    // errors cancel()
    const E_NOT_AUTHORIZED: u64 = 301;
    const E_INVALID_PHASE: u64 = 302;
    const E_ALREADY_REQUESTED: u64 = 303;

    /* Settings */

    // create() constraints
    const MIN_PLAYERS: u64 = 2;
    const MAX_PLAYERS: u64 = 256;
    const MIN_JUDGES: u64 = 1;
    const MAX_JUDGES: u64 = 32;

    // Bet.phase possible values
    const PHASE_FUND: u8 = 0;
    const PHASE_VOTE: u8 = 1;
    const PHASE_SETTLED: u8 = 2;
    const PHASE_CANCELED: u8 = 3;
    const PHASE_STALEMATE: u8 = 4;

    /* Structs */

    struct Bet<phantom T> has key, store
    {
        id: UID,
        phase: u8, // A bet goes through various stages: funding/voting/settled/...
        title: String,
        description: String,
        quorum: u64,
        size: u64, // Amount of Coin<T> that each player will bet
        players: vector<address>,
        judges: vector<address>,
        votes: VecMap<address, address>, // <judge_addr,  player_addr>
        funds: VecMap<address, Coin<T>>, // <player_addr, player_funds>
        answers: VecMap<address, String>, // <player_addr, player_answer>
        most_votes: u64, // number of votes received by the leading player (to detect stalemates)
        winner: Option<address>,
        cancel_requests: vector<address>

        // start_epoch: Option<u64>, // (maybe) voting starts on this day
        // end_epoch: Option<u64>, // (maybe) voting ends on this day
        // funds: vector<Item>, // (maybe) prize can be any asset(s)
    }

    struct CreateBetEvent has copy, drop {
        bet_id: ID,
        bet_title: String,
    }

    /* Accessors */

    public fun phase<T>(bet: &Bet<T>): u8 {
        bet.phase
    }
    public fun title<T>(bet: &Bet<T>): &String {
        &bet.title
    }
    public fun description<T>(bet: &Bet<T>): &String {
        &bet.description
    }
    public fun quorum<T>(bet: &Bet<T>): u64 {
        bet.quorum
    }
    public fun size<T>(bet: &Bet<T>): u64 {
        bet.size
    }
    public fun players<T>(bet: &Bet<T>): &vector<address> {
        &bet.players
    }
    public fun judges<T>(bet: &Bet<T>): &vector<address> {
        &bet.judges
    }
    public fun votes<T>(bet: &Bet<T>): &VecMap<address, address> {
        &bet.votes
    }
    public fun funds<T>(bet: &Bet<T>): &VecMap<address, Coin<T>> {
        &bet.funds
    }
    public fun most_votes<T>(bet: &Bet<T>): u64 {
        bet.most_votes
    }
    public fun winner<T>(bet: &Bet<T>): &Option<address> {
        &bet.winner
    }
    public fun cancel_requests<T>(bet: &Bet<T>): &vector<address> {
        &bet.cancel_requests
    }

    /* Core functionality */

    /// Anybody can define a new bet
    public entry fun create<T>(
        title: vector<u8>,
        description: vector<u8>,
        quorum: u64,
        size: u64,
        players: vector<address>,
        judges: vector<address>,
        ctx: &mut TxContext)
    {
        let player_len = vector::length(&players);
        let judge_len = vector::length(&judges);

        assert!( player_len >= MIN_PLAYERS && player_len <= MAX_PLAYERS, E_INVALID_NUMBER_OF_PLAYERS );
        assert!( judge_len >= MIN_JUDGES && judge_len <= MAX_JUDGES, E_INVALID_NUMBER_OF_JUDGES );
        assert!( !vectors::has_duplicates(&players), E_DUPLICATE_PLAYERS );
        assert!( !vectors::has_duplicates(&judges), E_DUPLICATE_JUDGES );
        assert!( !vectors::intersect(&players, &judges), E_JUDGES_CANT_BE_PLAYERS );
        assert!( (quorum > judge_len/2) && (quorum <= judge_len), E_INVALID_QUORUM );
        assert!( size > 0, E_INVALID_BET_SIZE );

        let bet_uid = object::new(ctx);

        event::emit(CreateBetEvent {
            bet_id: object::uid_to_inner(&bet_uid),
            bet_title: utf8(title),
        });

        let bet = Bet<T> {
            id: bet_uid,
            phase: PHASE_FUND,
            title: utf8(title),
            description: utf8(description),
            quorum: quorum,
            size: size,
            players: players,
            judges: judges,
            votes: vec_map::empty(),
            funds: vec_map::empty(),
            answers: vec_map::empty(),
            most_votes: 0,
            winner: option::none(),
            cancel_requests: vector::empty(),
        };
        transfer::share_object(bet);
    }

    /// Player locks funds for the bet
    public entry fun fund<T>(
        bet: &mut Bet<T>,
        answer: vector<u8>,
        player_coin: Coin<T>,
        ctx: &mut TxContext)
    {
        let player_addr = tx_context::sender(ctx);

        assert!( bet.phase == PHASE_FUND, E_NOT_IN_FUNDING_PHASE );
        assert!( vector::contains(&bet.players, &player_addr), E_ONLY_PLAYERS_CAN_FUND );
        assert!( !vec_map::contains(&bet.funds, &player_addr), E_ALREADY_FUNDED );

        let total_balance = coin::value(&player_coin);
        assert!( total_balance >= bet.size, E_FUNDS_BELOW_BET_SIZE );

        // Return change to sender
        let change = total_balance - bet.size;
        if ( change > 0 ) {
            transfer::public_transfer(
                coin::split(&mut player_coin, change, ctx),
                tx_context::sender(ctx)
            );
        };

        // Fund the bet
        vec_map::insert(&mut bet.funds, player_addr, player_coin);

        // Save the player's answer
        vec_map::insert(&mut bet.answers, player_addr, utf8(answer));

        // If all players have funded the Bet, advance to the voting phase
        if ( vec_map::size(&bet.funds) == vector::length(&bet.players) ) {
            bet.phase = PHASE_VOTE;
        };
    }

    /// Judge casts a vote for one of the players
    public entry fun vote<T>(
        bet: &mut Bet<T>,
        player_addr: address,
        ctx: &mut TxContext)
    {
        let judge_addr = tx_context::sender(ctx);
        assert!( bet.phase == PHASE_VOTE, E_NOT_IN_VOTING_PHASE );
        assert!( vector::contains(&bet.judges, &judge_addr), E_ONLY_JUDGES_CAN_VOTE );
        assert!( !vec_map::contains(&bet.votes, &judge_addr), E_ALREADY_VOTED );
        assert!( vector::contains(&bet.players, &player_addr), E_PLAYER_NOT_FOUND );

        // Cast the vote
        vec_map::insert(&mut bet.votes, judge_addr, player_addr);

        // Is this the most voted player so far?
        let player_vote_count = vec_maps::count_value(&bet.votes, &player_addr);
        if ( player_vote_count > bet.most_votes ) {
            bet.most_votes = player_vote_count;
        };

        // If the player that just received a vote is the winner, settle the bet
        if ( player_vote_count == bet.quorum ) {
            transfers::send_all(&mut bet.funds, player_addr, ctx);
            bet.winner = option::some(player_addr);
            bet.phase = PHASE_SETTLED;
            return
        };

        // If it's no longer possible for any player to win, refund everyone and end the bet
        if ( is_stalemate(bet) ) {
            transfers::refund_all(&mut bet.funds);
            bet.phase = PHASE_STALEMATE;
            return
        };
    }

    /// Judges and players can cancel the bet (and refund player deposits) in these scenarios:
    /// - If the bet is not fully funded, it can be canceled by any single judge or player.
    /// - If the bet is fully funded, it can be canceled if all players unanimously agree to it.
    public entry fun cancel<T>(
        bet: &mut Bet<T>,
        ctx: &mut TxContext
    ) {
        assert!( bet.phase == PHASE_FUND || bet.phase == PHASE_VOTE, E_INVALID_PHASE );
        let sender = tx_context::sender(ctx);
        let is_player = vector::contains(&bet.players, &sender);
        let is_judge = vector::contains(&bet.judges, &sender);
        assert!( is_player || is_judge, E_NOT_AUTHORIZED );

        // any judge or player can cancel the bet before all players deposit their funds
        if ( bet.phase == PHASE_FUND ) {
            transfers::refund_all(&mut bet.funds); // some players may have already funded the bet
            bet.phase = PHASE_CANCELED;
        }
        // players can unanimously cancel the bet during the voting phase
        else if ( bet.phase == PHASE_VOTE ) {
            assert!( is_player, E_NOT_AUTHORIZED );
            assert!( !vector::contains(&bet.cancel_requests, &sender), E_ALREADY_REQUESTED );
            // record the cancel request
            vector::push_back(&mut bet.cancel_requests, sender);
            // if all players requested to cancel the bet, cancel it
            let player_len = vector::length(&bet.players);
            let cancel_requests_len = vector::length(&bet.cancel_requests);
            if ( player_len == cancel_requests_len ) {
                transfers::refund_all(&mut bet.funds);
                bet.phase = PHASE_CANCELED;
            }
        };
    }

    /* Helpers */

    /// Returns true if it is no longer possible for any player to win the bet
    fun is_stalemate<T>(bet: &Bet<T>): bool {
        let number_of_judges = vector::length(&bet.judges);
        let votes_so_far = vec_map::size(&bet.votes);
        let votes_remaining = number_of_judges - votes_so_far;
        let distance_to_win = bet.quorum - bet.most_votes;
        return votes_remaining < distance_to_win
    }

    // One-Time-Witness
    struct BET has drop {}

    fun init(otw: BET, ctx: &mut TxContext)
    {
        let publisher = package::claim(otw, ctx);

        let bet_display = display::new_with_fields<Bet<sui::sui::SUI>>(
            &publisher,
            vector[
                utf8(b"name"),
                utf8(b"description"),
                utf8(b"link"),
                utf8(b"project_url"),
                utf8(b"creator"),
            ], vector[
                utf8(b"Bet: {title}"),
                utf8(b"{description}"),
                utf8(b"https://gotbeef.polymedia.app/bet/{id}"),
                utf8(b"https://gotbeef.polymedia.app"),
                utf8(b"https://polymedia.app")
            ], ctx
        );
        display::update_version(&mut bet_display);

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(bet_display, tx_context::sender(ctx));
    }
}
