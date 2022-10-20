#[test_only]
module gotbeef::bet_tests
{
    use std::option::{Self, Option};
    use std::string::{Self};
    use std::vector;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::vec_map;
    use sui::test_scenario::{Self as ts, Scenario};
    use gotbeef::bet::{Self, Bet};

    // Default bet settings
    const TITLE: vector<u8> = b"GCR vs Kwon";
    const DESC: vector<u8> = b"The Bet of the Century";
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

    /* Accessor tests */

    #[test]
    fun test_accessors()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        ts::next_tx(scen, SOMEONE); {
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;

            assert!( bet::phase(bet) == 0, 0 );
            assert!( bet::title(bet) == &string::utf8(TITLE), 0 );
            assert!( bet::description(bet) ==  &string::utf8(DESC), 0 );
            assert!( bet::quorum(bet) == QUORUM, 0 );
            assert!( bet::size(bet) == BET_SIZE, 0 );
            assert!( vector::length( bet::players(bet) ) == 2, 0 );
            assert!( vector::length( bet::judges(bet) ) == 2, 0 );
            assert!( vec_map::size( bet::votes(bet) ) == 0, 0 );
            assert!( vec_map::size( bet::funds(bet) ) == 0, 0 );
            assert!( bet::most_votes(bet) == 0, 0 );
            assert!( bet::winner(bet) == &option::none<address>(), 0 );

            ts::return_shared(bet_val);
        };
        ts::end(scen_val);
    }

    /* create() tests */

    #[test]
    fun test_create_success()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        ts::next_tx(scen, CREATOR); {
            let bet = ts::take_shared<Bet<SUI>>(scen);
            ts::return_shared(bet);
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 0)]
    fun test_create_e_judges_cant_be_players()
    {
        let players = vector[PLAYER_1, PLAYER_2, JUDGE_1];
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 2)]
    fun test_create_e_invalid_number_of_players()
    {
        let players = vector[PLAYER_1];
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 3)]
    fun test_create_e_invalid_number_of_judges()
    {
        let judges = vector[];
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, PLAYERS, judges, ts::ctx(scen) );
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 4)]
    fun test_create_e_duplicate_players()
    {
        let players = vector[@0xCAFE, @0x123, @0xCAFE];
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 5)]
    fun test_create_e_duplicate_judges()
    {
        let judges = vector[@0xAAA, @0xBBB, @0xAAA];
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, PLAYERS, judges, ts::ctx(scen) );
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 6)]
    fun test_create_e_invalid_quorum()
    {
        let quorum = 1;
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, quorum, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 7)]
    fun test_create_e_invalid_bet_size()
    {
        let size = 0;
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, QUORUM, size, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        ts::end(scen_val);
    }

    /* fund() tests */

    fun create_bet(scen: &mut Scenario) {
        bet::create<SUI>( TITLE, DESC, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
    }

    fun fund_bet(scen: &mut Scenario, amount: u64) {
        let bet_val = ts::take_shared<Bet<SUI>>(scen);
        let bet = &mut bet_val;
        let ctx = ts::ctx(scen);
        let funds = coin::mint_for_testing<SUI>(amount, ctx);
        bet::fund<SUI>(bet, funds, ctx);
        ts::return_shared(bet_val);
    }

    fun cast_vote(scen: &mut Scenario, player_addr: address) {
        let bet_val = ts::take_shared<Bet<SUI>>(scen);
        let bet = &mut bet_val;
        bet::vote(bet, player_addr, ts::ctx(scen));
        ts::return_shared(bet_val);
    }

    #[test]
    fun test_fund_success()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };

        // Verify bet initialization
        ts::next_tx(scen, SOMEONE);
        {
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            let funds = bet::funds<SUI>(bet);
            // nobody has funded the bet yet
            assert!( vec_map::is_empty(funds), 0 );
            // the bet phase is set to PHASE_FUND
            assert!( bet::phase(bet) == 0, 0 );
            ts::return_shared(bet_val);
        };

        // Player 1 funds the bet (sends too much, expects change back)
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE+100); };

        // Player 1 checks changes
        ts::next_tx(scen, PLAYER_1);
        {
            // Bet was partially funded
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            let funds = bet::funds<SUI>(bet);
            // only 1 player funded the bet so far
            assert!( vec_map::size(funds) == 1, 0 );
            // and it's who you'd expect
            assert!( vec_map::contains(funds, &PLAYER_1), 0 );
            // the bet remains in the funding phase
            assert!( bet::phase(bet) == 0, 0 );
            ts::return_shared(bet_val);

            // Player 1 got their change
            let change_coin = ts::take_from_sender<Coin<SUI>>(scen);
            assert!( coin::value(&change_coin) == 100, 0 );
            ts::return_to_sender(scen, change_coin);
        };

        // Player 2 funds the bet (send exact amount, expect no change)
        ts::next_tx(scen, PLAYER_2); { fund_bet(scen, BET_SIZE); };

        // Player 2 checks changes
        ts::next_tx(scen, PLAYER_2);
        {
            // Bet was completely funded
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            let funds = bet::funds<SUI>(bet);
            assert!( vec_map::size(funds) == vector::length(&PLAYERS), 0 );
            // both players have funded the bet
            assert!( vec_map::contains(funds, &PLAYER_2), 0 );
            // the bet is now in the voting phase
            assert!( bet::phase(bet) == 1, 0 );
            ts::return_shared(bet_val);

            // Player 2 didn't get any change
            assert!( !ts::has_most_recent_for_sender<Coin<SUI>>(scen), 0 );
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 100)]
    /// Non-player tries to funds the bet
    fun test_fund_e_only_players_can_fund()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };
        ts::next_tx(scen, SOMEONE); { fund_bet(scen, BET_SIZE); };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 101)]
    /// Player tries to fund the bet for the second time
    fun test_fund_e_already_funded()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 102)]
    /// Player tries to fund the bet with not enough coins
    fun test_fund_e_funds_below_bet_size()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE/2); };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 103)]
    /// Player tries to fund a closed bet
    fun test_fund_e_not_in_funding_phase()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };

        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_2); { fund_bet(scen, BET_SIZE); };

        ts::next_tx(scen, JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::next_tx(scen, JUDGE_2); { cast_vote(scen, PLAYER_1); };

        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::end(scen_val);
    }

    /* vote() tests */

    #[test]
    fun test_vote_success()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };

        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_2); { fund_bet(scen, BET_SIZE); };

        ts::next_tx(scen, JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::next_tx(scen, JUDGE_2); { cast_vote(scen, PLAYER_1); };

        // Anybody can verify the outcome
        ts::next_tx(scen, SOMEONE);
        {
            // Bet funds have been distributed
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            let funds = bet::funds<SUI>(bet);
            assert!( vec_map::size(funds) == 0, 0 );
            // The bet is now in the settled phase
            assert!( bet::phase(bet) == 2, 0 );
            // The bet winner is player 1
            let winner_opt = bet::winner(bet);
            assert!( option::contains(winner_opt, &PLAYER_1), 0 );
            ts::return_shared(bet_val);
        };

        // The winner received the funds
        ts::next_tx(scen, PLAYER_1);
        {
            let player_coin = ts::take_from_sender<Coin<SUI>>(scen);
            let actual_val = coin::value(&player_coin);
            let expect_val = BET_SIZE * vector::length(&PLAYERS);
            assert!( actual_val == expect_val, 0 );
            ts::return_to_sender(scen, player_coin);
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 200)]
    /// Judge tries to vote before all players have sent their funds
    fun test_e_vote_not_in_voting_phase()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_1); { cast_vote(scen, PLAYER_1); };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 201)]
    /// Non-judge tries to vote
    fun test_e_vote_only_judges_can_vote()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_2); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, SOMEONE); { cast_vote(scen, PLAYER_1); };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 202)]
    /// Judge tries to vote twice
    fun test_e_vote_already_voted()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_2); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::next_tx(scen, JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 203)]
    /// Judge tries to vote for a non-player
    fun test_e_vote_player_not_found()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; { create_bet(scen); };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_2); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, JUDGE_1); { cast_vote(scen, SOMEONE); };
        ts::end(scen_val);
    }

    /* cancel() tests */

    #[test]
    fun cancel_success()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            create_bet(scen);
        };
        ts::next_tx(scen, PLAYER_2); {
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            bet::cancel( bet, ts::ctx(scen) );
            assert!( bet::phase(bet) == 3, 0 );
            ts::return_shared(bet_val);
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 300)]
    /// Try to cancel a bet with funds
    fun test_cancel_e_bet_has_funds()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            create_bet(scen);
        };
        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_2); {
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            bet::cancel( bet, ts::ctx(scen) );
            ts::return_shared(bet_val);
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 301)]
    /// A non-participant tries to cancel a bet
    fun test_cancel_e_not_authorized()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            create_bet(scen);
        };
        ts::next_tx(scen, SOMEONE); {
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            bet::cancel( bet, ts::ctx(scen) );
            ts::return_shared(bet_val);
        };
        ts::end(scen_val);
    }

    #[test, expected_failure(abort_code = 103)]
    /// Try to cancel a settled bet
    fun test_cancel_e_not_in_funding_phase()
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            create_bet(scen);
        };

        ts::next_tx(scen, PLAYER_1); { fund_bet(scen, BET_SIZE); };
        ts::next_tx(scen, PLAYER_2); { fund_bet(scen, BET_SIZE); };

        ts::next_tx(scen, JUDGE_1); { cast_vote(scen, PLAYER_1); };
        ts::next_tx(scen, JUDGE_2); { cast_vote(scen, PLAYER_1); };

        ts::next_tx(scen, PLAYER_1); {
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            assert!( bet::phase(bet) == 2, 0 ); // PHASE_SETTLED
            bet::cancel( bet, ts::ctx(scen) );
            ts::return_shared(bet_val);
        };
        ts::end(scen_val);
    }

    /* is_stalemate() tests */

    fun test_expectations(
        players: vector<address>,
        judges: vector<address>,
        votes: vector<address>,
        quorum: u64,
        expect_phase: u8,
        expect_winner: Option<address>)
    {
        let scen_val = ts::begin(CREATOR);
        let scen = &mut scen_val; {
            bet::create<SUI>( TITLE, DESC, quorum, BET_SIZE, players, judges, ts::ctx(scen) );
        };

        // All players fund the bet
        let players_len = vector::length(&players);
        let i = 0;
        while (i < players_len) {
            let player_addr = vector::borrow(&players, i);
            ts::next_tx(scen, *player_addr); {
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
            ts::next_tx(scen, *judge_addr); {
                cast_vote(scen, *player_addr);
            };
            i = i + 1;
        };

        // Verify that the bet in the correct phase
        ts::next_tx(scen, SOMEONE); {
            let bet_val = ts::take_shared<Bet<SUI>>(scen);
            let bet = &mut bet_val;
            assert!( bet::phase(bet) == expect_phase, 0 );
            assert!( bet::winner(bet) == &expect_winner, 0 );
            ts::return_shared(bet_val);
        };
        ts::end(scen_val);
    }

    #[test]
    /// Verify the outcome in various situations
    fun test_end_to_end()
    {
        /* 1-of-1 */
        test_expectations(
            /* players */ vector[@0xA1, @0xA2],
            /* judges */  vector[@0xB1],
            /* votes */   vector[@0xA1],
            /* quorum */  1,
            /* expect_phase */ 2, // PHASE_SETTLED
            /* expect_winner */ option::some(@0xA1),
        );

        /* 2-of-2 */
        test_expectations(
            /* players */ vector[@0xA1, @0xA2],
            /* judges */  vector[@0xB1, @0xB2],
            /* votes */   vector[@0xA1, @0xA2],
            /* quorum */  2,
            /* expect_phase */ 4, // PHASE_STALEMATE
            /* expect_winner */ option::none<address>(),
        );
        test_expectations(
            /* players */ vector[@0xA1, @0xA2],
            /* judges */  vector[@0xB1, @0xB2],
            /* votes */   vector[@0xA1, @0xA1],
            /* quorum */  2,
            /* expect_phase */ 2, // PHASE_SETTLED
            /* expect_winner */ option::some(@0xA1),
        );

        /* 3-of-5 */
        test_expectations(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5],
            /* votes */   vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* quorum */  3,
            /* expect_phase */ 4, // PHASE_STALEMATE
            /* expect_winner */ option::none<address>(),
        );
        test_expectations(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4, @0xA5],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5],
            /* votes */   vector[@0xA1, @0xA2, @0xA3, @0xA3, @0xA4],
            /* quorum */  3,
            /* expect_phase */ 4, // PHASE_STALEMATE
            /* expect_winner */ option::none<address>(),
        );
        test_expectations(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5],
            /* votes */   vector[@0xA1, @0xA2, @0xA3, @0xA3],
            /* quorum */  3,
            /* expect_phase */ 1, // PHASE_VOTE
            /* expect_winner */ option::none<address>(),
        );

        /* 5-of-7 */
        test_expectations(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5, @0xB6, @0xB7],
            /* votes */   vector[@0xA1, @0xA1, @0xA1, @0xA2, @0xA2, @0xA2],
            /* quorum */  5,
            /* expect_phase */ 4, // PHASE_STALEMATE
            /* expect_winner */ option::none<address>(),
        );

        /* 5-of-7 */
        test_expectations(
            /* players */ vector[@0xA1, @0xA2, @0xA3, @0xA4],
            /* judges */  vector[@0xB1, @0xB2, @0xB3, @0xB4, @0xB5, @0xB6, @0xB7],
            /* votes */   vector[@0xA1, @0xA1, @0xA1, @0xA2, @0xA2],
            /* quorum */  5,
            /* expect_phase */ 1, // PHASE_VOTE
            /* expect_winner */ option::none<address>(),
        );
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
    aborts_if coin::value(player_coin) < bet.size with E_FUNDS_BELOW_BET_SIZE;
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
