/// Create bets between 2 or more players. Includes escrow and voting functionality.
module beef::bet
{
    use std::vector;
    use sui::coin::{Self, Coin};
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::utf8::{Self, String};
    use sui::vec_map::{Self, VecMap};
    use beef::transfers;
    use beef::vec_maps;
    use beef::vectors;

    /** Errors **/

    // create()
    const E_JUDGES_CANT_BE_PLAYERS: u64 = 0;
    const E_INVALID_NUMBER_OF_PLAYERS: u64 = 2;
    const E_INVALID_NUMBER_OF_JUDGES: u64 = 3;
    const E_DUPLICATE_PLAYERS: u64 = 4;
    const E_DUPLICATE_JUDGES: u64 = 5;
    const E_INVALID_QUORUM: u64 = 6;

    // fund()
    const E_ONLY_PLAYERS_CAN_FUND: u64 = 100;
    const E_ALREADY_FUNDED: u64 = 101;
    const E_FUNDS_BELOW_BET_SIZE: u64 = 102;
    const E_NOT_IN_FUNDING_PHASE: u64 = 103;

    // vote()
    const E_NOT_IN_VOTING_PHASE: u64 = 200;
    const E_ONLY_JUDGES_CAN_VOTE: u64 = 201;
    const E_ALREADY_VOTED: u64 = 202; // maybe: allow judges to update their vote
    const E_PLAYER_NOT_FOUND: u64 = 203;

    // cancel()
    const E_CANCEL_BET_HAS_FUNDS: u64 = 300;
    const E_CANCEL_NOT_AUTHORIZED: u64 = 301;

    /** Settings **/

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

    /** Structs **/

    struct Bet<phantom T> has key, store
    {
        id: UID,
        phase: u8, // A bet goes through various stages: funding/voting/settled/...
        title: String,
        quorum: u64,
        bet_size: u64, // Amount of Coin<T> that each participant will bet
        players: vector<address>,
        judges: vector<address>,
        votes: VecMap<address, address>, // <judge_addr,  player_addr>
        funds: VecMap<address, Coin<T>>, // <player_addr, player_funds>
        most_votes: u64, // number of votes received by the leading player

        // Maybe:
        // description: String,
        // winner: address, // record winner for posterity?
        // start_epoch: Option<u64>, // voting starts on this day
        // end_epoch: Option<u64>, // voting ends on this day
        // funds: vector<Item>, // prize can be any asset(s)
    }

    /** Functions **/

    public fun funds<T>(bet: &Bet<T>): &VecMap<address, Coin<T>> {
        &bet.funds
    }

    public fun phase<T>(bet: &Bet<T>): &u8 {
        &bet.phase
    }

    /// Anybody can define a new bet
    public entry fun create<T>(
        title: vector<u8>,
        quorum: u64,
        bet_size: u64,
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

        let bet = Bet<T> {
            id: object::new(ctx),
            phase: PHASE_FUND,
            title: utf8::string_unsafe(title),
            quorum: quorum,
            bet_size: bet_size,
            players: players,
            judges: judges,
            votes: vec_map::empty(),
            funds: vec_map::empty(),
            most_votes: 0,
        };
        transfer::share_object(bet);
    }

    /// Player locks funds for the bet
    public entry fun fund<T>(
        bet: &mut Bet<T>,
        player_coin: Coin<T>,
        ctx: &mut TxContext)
    {
        let player_addr = tx_context::sender(ctx);
        let coin_value = coin::value(&player_coin);

        assert!( bet.phase == PHASE_FUND, E_NOT_IN_FUNDING_PHASE );
        assert!( vector::contains(&bet.players, &player_addr), E_ONLY_PLAYERS_CAN_FUND );
        assert!( !vec_map::contains(&bet.funds, &player_addr), E_ALREADY_FUNDED );
        assert!( coin_value >= bet.bet_size, E_FUNDS_BELOW_BET_SIZE );

        // Return change to sender
        let change = coin_value - bet.bet_size;
        if ( change > 0 ) {
            coin::split(&mut player_coin, change, ctx);
        };

        // Fund the bet
        vec_map::insert(&mut bet.funds, player_addr, player_coin);

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
        if ( player_vote_count >= bet.quorum ) {
            transfers::send_all(&mut bet.funds, player_addr, ctx);
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

    /// Some scenarios where we might want to cancel the bet and refund the players:
    /// - (done) If there's no funding, any judge or player may cancel it at any time.
    /// - (todo) If all players agree on cancelling the bet.
    /// - (maybe) If end_epoch is reached without a quorum, any judge or player can cancel the bet.
    /// - (maybe) If a quorum of judges agree on cancelling the bet.
    public entry fun cancel<T>(bet: &mut Bet<T>, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let is_player = vector::contains(&bet.players, &sender);
        let is_judge = vector::contains(&bet.judges, &sender);
        assert!( vec_map::is_empty(&bet.funds), E_CANCEL_BET_HAS_FUNDS );
        assert!( is_player || is_judge, E_CANCEL_NOT_AUTHORIZED );
        bet.phase = PHASE_CANCELED;
    }

    /// Returns true if it is no longer possible for any player to win the bet
    fun is_stalemate<T>(bet: &Bet<T>): bool {
        let number_of_judges = vector::length(&bet.judges);
        let votes_so_far = vec_map::size(&bet.votes);
        let votes_remaining = number_of_judges - votes_so_far;
        let distance_to_win = bet.quorum - bet.most_votes;
        return votes_remaining < distance_to_win
    }
}

#[test_only]
module beef::bet_tests
{
    use std::vector;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::vec_map;
    use sui::test_scenario::{Self as ts, Scenario};
    use beef::bet::{Self, Bet};

    // default bet settings
    const TITLE: vector<u8> = b"Frazier vs Ali";
    const QUORUM: u64 = 2;
    const BET_SIZE: u64 = 500;
    const CREATOR: address = @0x777;
    const PLAYER_1: address = @0xA1;
    const PLAYER_2: address = @0xA2;
    const PLAYERS: vector<address> = vector[@0xA1, @0xA2];
    const JUDGE_1: address = @0xB1;
    const JUDGE_2: address = @0xB2;
    const JUDGES: vector<address> = vector[@0xB1, @0xB2];
    const SOMEONE: address = @0xC0B1E;

    /* create() */

    #[test]
    fun test_create_success()
    {
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        ts::next_tx(scen, &CREATOR); {
            let bet = ts::take_shared<Bet<SUI>>(scen);
            ts::return_shared(scen, bet);
        };
    }

    #[test, expected_failure(abort_code = 0)]
    fun test_create_judges_cant_be_players()
    {
        let players = vector[PLAYER_1, PLAYER_2, JUDGE_1];
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 2)]
    fun test_create_invalid_number_of_players()
    {
        let players = vector[PLAYER_1];
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 3)]
    fun test_create_invalid_number_of_judges()
    {
        let judges = vector[];
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, judges, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 4)]
    fun test_create_duplicate_players()
    {
        let players = vector[@0xCAFE, @0x123, @0xCAFE];
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 5)]
    fun test_create_duplicate_judges()
    {
        let judges = vector[@0xAAA, @0xBBB, @0xAAA];
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, judges, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 6)]
    fun test_create_invalid_quorum()
    {
        let quorum = 1;
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, quorum, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
    }

    /* fund() */

    fun create_bet(scen: &mut Scenario) {
        bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
    }

    fun fund_bet(scen: &mut Scenario, amount: u64) {
        let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
        let bet = ts::borrow_mut(&mut bet_wrapper);
        let ctx = ts::ctx(scen);
        let funds = coin::mint_for_testing<SUI>(amount, ctx);
        bet::fund<SUI>(bet, funds, ctx);
        ts::return_shared(scen, bet_wrapper);
    }

    fun cast_vote(scen: &mut Scenario, player_addr: address) {
        let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
        let bet = ts::borrow_mut(&mut bet_wrapper);
        bet::vote(bet, player_addr, ts::ctx(scen));
        ts::return_shared(scen, bet_wrapper);
    }

    #[test]
    fun test_fund_success()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };

        // Verify bet initialization
        ts::next_tx(scen, &SOMEONE);
        {
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            let funds = bet::funds<SUI>(bet);
            // nobody has funded the bet yet
            assert!( vec_map::is_empty(funds), 0 );
            // the bet phase is set to PHASE_FUND
            assert!( bet::phase(bet) == &0, 0 );
            ts::return_shared(scen, bet_wrapper);
        };

        // Player 1 funds the bet (sends too much, expects change back)
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE+100); };

        // Player 1 checks changes
        ts::next_tx(scen, &PLAYER_1);
        {
            // Bet was partially funded
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            let funds = bet::funds<SUI>(bet);
            // only 1 player funded the bet so far
            assert!( vec_map::size(funds) == 1, 0 );
            // and it's who you'd expect
            assert!( vec_map::contains(funds, &PLAYER_1), 0 );
            // the bet remains in the funding phase
            assert!( bet::phase(bet) == &0, 0 );
            ts::return_shared(scen, bet_wrapper);

            // Player 1 got their change
            let change_coin = ts::take_owned<Coin<SUI>>(scen);
            assert!( coin::value(&change_coin) == 100, 0 );
            ts::return_owned(scen, change_coin);
        };

        // Player 2 funds the bet (send exact amount, expect no change)
        ts::next_tx(scen, &PLAYER_2); { fund_bet(scen, BET_SIZE); };

        // Player 2 checks changes
        ts::next_tx(scen, &PLAYER_2);
        {
            // Bet was completely funded
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            let funds = bet::funds<SUI>(bet);
            assert!( vec_map::size(funds) == vector::length(&PLAYERS), 0 );
            // both players have funded the bet
            assert!( vec_map::contains(funds, &PLAYER_2), 0 );
            // the bet is now in the voting phase
            assert!( bet::phase(bet) == &1, 0 );
            ts::return_shared(scen, bet_wrapper);

            // Player 2 didn't get any change
            assert!( !ts::can_take_owned<Coin<SUI>>(scen), 0 );
        };
    }

    #[test, expected_failure(abort_code = 100)]
    /// Non-player tries to funds the bet
    fun test_fund_only_players_can_fund()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };
        ts::next_tx(scen, &SOMEONE); { fund_bet(scen, BET_SIZE); };
    }

    #[test, expected_failure(abort_code = 101)]
    /// Player tries to fund the bet for the second time
    fun test_fund_already_funded()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
    }

    #[test, expected_failure(abort_code = 102)]
    /// Player tries to fund the bet with not enough coins
    fun test_fund_funds_below_bet_size()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE/2); };
    }

    #[test, expected_failure(abort_code = 103)]
    /// Player tries to fund a closed bet
    fun test_fund_not_in_funding_phase()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };

        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_2); { fund_bet(scen, BET_SIZE); };

        ts::next_tx(scen, &JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::next_tx(scen, &JUDGE_2); { cast_vote(scen, PLAYER_1); };

        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
    }

    /* vote() */

    #[test]
    fun vote_success()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };

        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_2); { fund_bet(scen, BET_SIZE); };

        ts::next_tx(scen, &JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::next_tx(scen, &JUDGE_2); { cast_vote(scen, PLAYER_1); };

        // Anybody can verify the outcome
        ts::next_tx(scen, &SOMEONE); {
            // Bet funds have been distributed
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            let funds = bet::funds<SUI>(bet);
            assert!( vec_map::size(funds) == 0, 0 );
            // The bet is now in the settled phase
            assert!( bet::phase(bet) == &2, 0 );
            ts::return_shared(scen, bet_wrapper);
        };

        // The winner received the funds
        ts::next_tx(scen, &PLAYER_1); {
            let player_coin = ts::take_owned<Coin<SUI>>(scen);
            let actual_val = coin::value(&player_coin);
            let expect_val = BET_SIZE * vector::length(&PLAYERS);
            assert!( actual_val == expect_val, 0 );
            ts::return_owned(scen, player_coin);
        };
    }

    #[test, expected_failure(abort_code = 200)]
    /// Judge tries to vote before all players have sent their funds
    fun test_vote_not_in_voting_phase()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_1); { cast_vote(scen, PLAYER_1); };
    }

    #[test, expected_failure(abort_code = 201)]
    /// Non-judge tries to vote
    fun test_vote_only_judges_can_vote()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_2); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &SOMEONE); { cast_vote(scen, PLAYER_1); };
    }

    #[test, expected_failure(abort_code = 202)]
    /// Judge tries to vote twice
    fun test_vote_already_voted()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_2); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::next_tx(scen, &JUDGE_1); { cast_vote(scen, PLAYER_1); };
    }

    #[test, expected_failure(abort_code = 203)]
    /// Judge tries to vote for a non-player
    fun test_vote_player_not_found()
    {
        let scen = &mut ts::begin(&CREATOR); { create_bet(scen); };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_2); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &JUDGE_1); { cast_vote(scen, SOMEONE); };
    }

    /* is_stalemate() */

    fun test_stalemate(
        players: vector<address>,
        judges: vector<address>,
        votes: vector<address>,
        quorum: u64,
        expect_phase: u8)
    {
        let scen = &mut ts::begin(&CREATOR); {
            bet::create<SUI>( TITLE, quorum, BET_SIZE, players, judges, ts::ctx(scen) );
        };

        // All players fund the bet
        let players_len = vector::length(&players);
        let i = 0;
        while (i < players_len) {
            let player_addr = vector::borrow(&players, i);
            ts::next_tx(scen, player_addr); {
                fund_bet(scen, BET_SIZE);
            };
            i = i + 1;
        };

        // Some votes are cast
        let votes_len = vector::length(&votes);
        let i = 0;
        while (i < votes_len) {
            let judge_addr = vector::borrow(&judges, i);
            let player_addr = vector::borrow(&votes, i);
            ts::next_tx(scen, judge_addr); {
                cast_vote(scen, *player_addr);
            };
            i = i + 1;
        };

        // Verify that the bet in the correct phase
        ts::next_tx(scen, &SOMEONE); {
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            assert!( *bet::phase(bet) == expect_phase, 0 );
            ts::return_shared(scen, bet_wrapper);
        };
    }

    #[test]
    fun test_is_stalemate()
    {
        /* 1-of-1 */
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2],
            /* judges */  vector[@0xB1],
            /* votes */   vector[@0xA1],
            /* quorum */  1,
            /* expect_phase */ 2, // PHASE_SETTLED
        );

        /* 2-of-2 */
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2],
            /* judges */  vector[@0xB1, @0xB2],
            /* votes */   vector[@0xA1, @0xA2],
            /* quorum */  2,
            /* expect_phase */ 4, // PHASE_STALEMATE
        );
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2],
            /* judges */  vector[@0xB1, @0xB2],
            /* votes */   vector[@0xA1, @0xA1],
            /* quorum */  2,
            /* expect_phase */ 2, // PHASE_SETTLED
        );

        /* 3-of-5 */
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5],
            /* votes */   vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* quorum */  3,
            /* expect_phase */ 4, // PHASE_STALEMATE
        );
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4, @0xA5],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5],
            /* votes */   vector[@0xA1, @0xA2, @0xA3, @0xA3, @0xA4],
            /* quorum */  3,
            /* expect_phase */ 4, // PHASE_STALEMATE
        );
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5],
            /* votes */   vector[@0xA1, @0xA2, @0xA3, @0xA3],
            /* quorum */  3,
            /* expect_phase */ 1, // PHASE_VOTE
        );

        /* 5-of-7 */
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5, @0xB6, @0xB7],
            /* votes */   vector[@0xA1, @0xA1, @0xA1, @0xA2, @0xA2, @0xA2],
            /* quorum */  5,
            /* expect_phase */ 4, // PHASE_STALEMATE
        );

        /* 5-of-7 */
        test_stalemate(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5, @0xB6, @0xB7],
            /* votes */   vector[@0xA1, @0xA1, @0xA1, @0xA2, @0xA2],
            /* quorum */  5,
            /* expect_phase */ 1, // PHASE_VOTE
        );
    }

    /* cancel() */

    #[test]
    fun cancel_success()
    {
        let scen = &mut ts::begin(&CREATOR); {
            create_bet(scen);
        };
        ts::next_tx(scen, &PLAYER_2); {
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            bet::cancel( bet, ts::ctx(scen) );
            assert!( *bet::phase(bet) == 3, 0 );
            ts::return_shared(scen, bet_wrapper);
        };
    }

    #[test, expected_failure(abort_code = 300)]
    /// Try to cancel a bet with funds
    fun test_cancel_bet_has_funds()
    {
        let scen = &mut ts::begin(&CREATOR); {
            create_bet(scen);
        };
        ts::next_tx(scen, &PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, &PLAYER_2); {
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            bet::cancel( bet, ts::ctx(scen) );
            ts::return_shared(scen, bet_wrapper);
        };
    }

    #[test, expected_failure(abort_code = 301)]
    /// A non-participant tries to cancel a bet
    fun test_cancel_not_authorized()
    {
        let scen = &mut ts::begin(&CREATOR); {
            create_bet(scen);
        };
        ts::next_tx(scen, &SOMEONE); {
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            bet::cancel( bet, ts::ctx(scen) );
            ts::return_shared(scen, bet_wrapper);
        };
    }
}

/* Specs */

/*
spec create
{
    pragma aborts_if_is_strict;
    aborts_if ctx.ids_created == MAX_U64 with EXECUTION_FAILURE;
    aborts_if len(players) < MIN_PLAYERS || len(players) > MAX_PLAYERS;
    aborts_if len(judges) < MIN_JUDGES || len(judges) > MAX_JUDGES;
    aborts_if quorum <= len(judges)/2 || quorum > len(judges) with E_INVALID_QUORUM;
    // aborts_if players/judges have duplicates => can this be expressed here?
    // aborts_if players & judges have elements in common => can this be expressed here?
}
spec {
    // Assume there's no duplicates or overlapping addresses, because
    // IDK how to express those abort conditions in the function spec.
    assume !has_dup_players;
    assume !has_dup_judges;
    assume !judge_is_player;
};
*/

/*
spec fund
{
    pragma aborts_if_is_strict;
    aborts_if ctx.ids_created == MAX_U64 with EXECUTION_FAILURE;
    aborts_if !contains(bet.players, tx_context::sender(ctx)) with E_ONLY_PLAYERS_CAN_FUND;
    aborts_if coin::value(player_coin) < bet.bet_size with E_FUNDS_BELOW_BET_SIZE;
    // How to express this?:
    // aborts_if vec_map::contains(bet.funds, tx_context::sender(ctx)) with E_ALREADY_FUNDED;
    // aborts_if contains(bet.funds.contents, tx_context::sender(ctx) ) with E_ALREADY_FUNDED;
}
*/

/*
spec vote
{
    pragma aborts_if_is_strict;
    aborts_if !contains(bet.judges, tx_context::sender(ctx)) with E_ONLY_JUDGES_CAN_VOTE;
    aborts_if !contains(bet.players, player_addr) with E_PLAYER_NOT_FOUND;
    aborts_if bet.phase != PHASE_VOTE with E_NOT_IN_VOTING_PHASE;
    // How to express this?:
    // aborts_if vec_map::contains(bet.votes, tx_context::sender(ctx)) with E_ALREADY_VOTED;
}
*/
