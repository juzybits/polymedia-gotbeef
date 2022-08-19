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
    use beef::vector_util;

    /** Errors **/

    // create()
    const E_JUDGES_CANT_BE_PLAYERS: u64 = 0;
    const E_ADMIN_CANT_BE_PLAYER: u64 = 1;
    const E_INVALID_NUMBER_OF_PLAYERS: u64 = 2;
    const E_INVALID_NUMBER_OF_JUDGES: u64 = 3;
    const E_DUPLICATE_PLAYERS: u64 = 4;
    const E_DUPLICATE_JUDGES: u64 = 5;
    const E_INVALID_QUORUM: u64 = 6;

    // fund()
    const E_ONLY_PLAYERS_CAN_FUND: u64 = 100;
    const E_ALREADY_FUNDED: u64 = 101;
    const E_FUNDS_BELOW_BET_SIZE: u64 = 102;

    // vote()
    const E_ONLY_JUDGES_CAN_VOTE: u64 = 200;
    const E_ALREADY_VOTED: u64 = 201;

    /** Settings **/

    // create() constraints
    const MIN_PLAYERS: u64 = 2;
    const MAX_PLAYERS: u64 = 128;
    const MIN_JUDGES: u64 = 1;
    const MAX_JUDGES: u64 = 32;

    // Bet.phase possible values
    const PHASE_FUND: u8 = 0;
    const PHASE_VOTE: u8 = 1;

    /** Structs **/

    struct Bet<phantom T> has key, store
    {
        id: UID,
        phase: u8,
        title: String,
        quorum: u64,
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
        let admin_addr = tx_context::sender(ctx);
        let player_len = vector::length(&players);
        let judge_len = vector::length(&judges);
        let has_dup_players = vector_util::has_duplicates(&players);
        let has_dup_judges = vector_util::has_duplicates(&judges);
        let judge_is_player = vector_util::intersect(&players, &judges);
        spec {
            // Assume there's no duplicates or overlapping addresses, because
            // IDK how to express those abort conditions in the function spec.
            assume !has_dup_players;
            assume !has_dup_judges;
            assume !judge_is_player;
        };

        assert!(player_len >= MIN_PLAYERS && player_len <= MAX_PLAYERS, E_INVALID_NUMBER_OF_PLAYERS);
        assert!(judge_len >= MIN_JUDGES && judge_len <= MAX_JUDGES, E_INVALID_NUMBER_OF_JUDGES);
        assert!(!vector::contains(&players, &admin_addr), E_ADMIN_CANT_BE_PLAYER);
        assert!(!has_dup_players, E_DUPLICATE_PLAYERS);
        assert!(!has_dup_judges, E_DUPLICATE_JUDGES);
        assert!(!judge_is_player, E_JUDGES_CANT_BE_PLAYERS);
        assert!((quorum > judge_len/2) && (quorum <= judge_len), E_INVALID_QUORUM);

        let bet = Bet<T> {
            id: object::new(ctx),
            phase: PHASE_FUND,
            title: utf8::string_unsafe(title),
            quorum: quorum,
            bet_size: bet_size,
            admin: admin_addr,
            players: players,
            judges: judges,
            votes: vec_map::empty(),
            funds: vec_map::empty(),
        };
        transfer::share_object(bet);
    }

    /// Player locks funds for the bet
    public entry fun fund<T>(
        bet: &mut Bet<T>,
        player_coin:
        Coin<T>,
        ctx: &mut TxContext)
    {
        let player_addr = tx_context::sender(ctx);
        let coin_value = coin::value(&player_coin);

        assert!(vector::contains(&bet.players, &player_addr), E_ONLY_PLAYERS_CAN_FUND);
        assert!(!vec_map::contains(&bet.funds, &player_addr), E_ALREADY_FUNDED);
        assert!(coin_value >= bet.bet_size, E_FUNDS_BELOW_BET_SIZE);

        // Return change to sender
        let change = coin_value - bet.bet_size;
        if (change > 0) {
            coin::split(&mut player_coin, change, ctx);
        };

        // Fund the bet
        vec_map::insert(&mut bet.funds, player_addr, player_coin);

        // If all players have funded the Bet, move to the "vote" phase
        if (vec_map::size(&bet.funds) == vector::length(&bet.players)) {
            bet.phase = PHASE_VOTE;
        };
    }

    /// Judge casts a vote for one of the player addresses
    public entry fun vote(_ctx: &mut TxContext)
    {

    }

    /// Some scenarios where we might want to cancel the bet and refund the players:
    /// - If there's no funding, the bet admin may cancel it at any time.
    /// - If after the last vote there is no quorum, the bet automatically cancels.
    /// - If end_epoch is reached without a quorum, any participant can cancel the bet.
    /// - If the players both agree on cancelling the bet (adds complexity).
    public entry fun cancel(_ctx: &mut TxContext)
    {

    }

    // public entry fun destroy(_ctx: &mut TxContext) {}

    /** Specs **/

    spec create
    {
        pragma aborts_if_is_strict;
        aborts_if ctx.ids_created == MAX_U64 with EXECUTION_FAILURE;
        aborts_if len(players) < MIN_PLAYERS || len(players) > MAX_PLAYERS;
        aborts_if len(judges) < MIN_JUDGES || len(judges) > MAX_JUDGES;
        aborts_if contains(players, tx_context::sender(ctx)) with E_ADMIN_CANT_BE_PLAYER;
        aborts_if quorum <= len(judges)/2 || quorum > len(judges) with E_INVALID_QUORUM;
        // aborts_if players/judges have duplicates => can this be expressed here?
        // aborts_if players & judges have elements in common => can this be expressed here?
    }
}

#[test_only]
module beef::bet_tests
{
    // use std::debug::print as print;
    use std::vector;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::vec_map;
    use sui::test_scenario::{Self as ts, Scenario};
    use beef::bet::{Self, Bet};

    const TITLE: vector<u8> = b"Frazier vs Ali";
    const QUORUM: u64 = 2;
    const BET_SIZE: u64 = 500;
    const ADMIN_ADDR: address = @0x777;
    const PLAYER_1: address = @0xA1;
    const PLAYER_2: address = @0xA2;
    const PLAYERS: vector<address> = vector[@0xA1, @0xA2];
    const JUDGE_1: address = @0xB1;
    const JUDGE_2: address = @0xB2;
    const JUDGES: vector<address> = vector[@0xB1, @0xB2];

    /* create() */

    #[test]
    fun test_create_success()
    {
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        ts::next_tx(scen, &ADMIN_ADDR); {
            let bet = ts::take_shared<Bet<SUI>>(scen);
            ts::return_shared(scen, bet);
        };
    }

    #[test, expected_failure(abort_code = 0)]
    fun test_create_judges_cant_be_players()
    {
        let players = vector[PLAYER_1, PLAYER_2, JUDGE_1];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 1)]
    fun test_create_admin_cant_be_player()
    {
        let players = vector[PLAYER_1, PLAYER_2, ADMIN_ADDR];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 2)]
    fun test_create_invalid_number_of_players()
    {
        let players = vector[PLAYER_1];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 3)]
    fun test_create_invalid_number_of_judges()
    {
        let judges = vector[];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, judges, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 4)]
    fun test_create_duplicate_players()
    {
        let players = vector[@0xCAFE, @0x123, @0xCAFE];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 5)]
    fun test_create_duplicate_judges()
    {
        let judges = vector[@0xAAA, @0xBBB, @0xAAA];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, judges, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 6)]
    fun test_create_invalid_quorum()
    {
        let quorum = 1;
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, quorum, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
    }

    /* fund() */

    /// Fund a bet with the specified amount
    fun fund_bet(scen: &mut Scenario, amount: u64) {
        let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
        let bet = ts::borrow_mut(&mut bet_wrapper);
        let ctx = ts::ctx(scen);
        let nonplayer_coin = coin::mint_for_testing<SUI>(amount, ctx);
        bet::fund<SUI>(bet, nonplayer_coin, ctx);
        ts::return_shared(scen, bet_wrapper);
    }

    #[test]
    fun test_fund_success()
    {
        // Admin creates a new bet
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };

        // Admin checks changes
        ts::next_tx(scen, &ADMIN_ADDR);
        {
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            let funds = bet::funds<SUI>(bet);
            // nobody has funded the bet yet
            assert!(vec_map::is_empty(funds), 0);
            // the bet phase is set to PHASE_FUND
            assert!(bet::phase(bet) == &0, 0);
            ts::return_shared(scen, bet_wrapper);
        };

        // Player 1 funds the bet
        ts::next_tx(scen, &PLAYER_1); {
            // send too much, expect change back
            fund_bet(scen, BET_SIZE+100);
        };

        // Player 1 checks changes
        ts::next_tx(scen, &PLAYER_1);
        {
            // Bet was partially funded
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            let funds = bet::funds<SUI>(bet);
            // only 1 player funded the bet so far
            assert!(vec_map::size(funds) == 1, 0);
            // and it's who you'd expect
            assert!(vec_map::contains(funds, &PLAYER_1), 0);
            // the bet remains in the funding phase
            assert!(bet::phase(bet) == &0, 0);
            ts::return_shared(scen, bet_wrapper);

            // Player 1 got their change
            let change_coin = ts::take_owned<Coin<SUI>>(scen);
            assert!(coin::value(&change_coin) == 100, 0);
            ts::return_owned(scen, change_coin);
        };

        // Player 2 funds the bet
        ts::next_tx(scen, &PLAYER_2); {
            // send exact amount, expect no change
            fund_bet(scen, BET_SIZE);
        };

        // Player 2 checks changes
        ts::next_tx(scen, &PLAYER_2);
        {
            // Bet was completely funded
            let bet_wrapper = ts::take_shared<Bet<SUI>>(scen);
            let bet = ts::borrow_mut(&mut bet_wrapper);
            let funds = bet::funds<SUI>(bet);
            assert!(vec_map::size(funds) == vector::length(&PLAYERS), 0);
            // both players have funded the bet
            assert!(vec_map::contains(funds, &PLAYER_2), 0);
            // the bet is now in the voting phase
            assert!(bet::phase(bet) == &1, 0);
            ts::return_shared(scen, bet_wrapper);

            // Player 2 didn't get any change
            assert!(!ts::can_take_owned<Coin<SUI>>(scen), 0);
        };
    }

    #[test, expected_failure(abort_code = 100)]
    fun test_fund_only_players_can_fund()
    {
        // Admin creates a new bet
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        // A non-player tries to funds the bet
        ts::next_tx(scen, &@0xC0B1E); {
            fund_bet(scen, BET_SIZE);
        };
    }

    #[test, expected_failure(abort_code = 101)]
    fun test_fund_already_funded()
    {
        // Admin creates a new bet
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        // Player 1 funds the bet
        ts::next_tx(scen, &PLAYER_1); {
            fund_bet(scen, BET_SIZE);
        };
        // Player 1 tries to fund the bet again
        ts::next_tx(scen, &PLAYER_1); {
            fund_bet(scen, BET_SIZE);
        };
    }

    #[test, expected_failure(abort_code = 102)]
    fun test_fund_funds_below_bet_size()
    {
        // Admin creates a new bet
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
        };
        // Player 1 tries to fund the bet with not enough coins
        ts::next_tx(scen, &PLAYER_1); {
            fund_bet(scen, BET_SIZE/2);
        };
    }
}

/// Utility functions for vectors
module beef::vector_util
{
    use std::vector;

    /// Returns true if any vector elements appear more than once
    public fun has_duplicates<T>(vec: &vector<T>): bool {
        let vec_len = vector::length(vec);
        let i = 0;
        while (i < vec_len) {
            let i_addr = vector::borrow(vec, i);
            let z = i + 1;
            while (z < vec_len) {
                let z_addr = vector::borrow(vec, z);
                if (i_addr == z_addr) {
                    return true
                };
                z = z + 1;
            };
            i = i + 1;
        };
        return false
    }

    /// Returns true if any of the elements in one vector are present in the other vector
    public fun intersect<T>(vec1: &vector<T>, vec2: &vector<T>): bool {
        let vec_len1 = vector::length(vec1);
        let vec_len2 = vector::length(vec2);
        let i1 = 0;
        while (i1 < vec_len1) {
            let addr1 = vector::borrow(vec1, i1);
            let i2 = 0;
            while (i2 < vec_len2) {
                let addr2 = vector::borrow(vec2, i2);
                if (addr1 == addr2) {
                    return true
                };
                i2 = i2 + 1;
            };
            i1 = i1 + 1;
        };
        return false
    }
}

#[test_only]
module beef::vector_util_tests
{
    use sui::test_scenario;
    use beef::vector_util as vu;

    #[test]
    fun test_has_duplicates()
    {
        test_scenario::begin(&@0x1); {
            assert!(!vu::has_duplicates(&vector[@0x100, @0x222, @0x333, @0x444]), 0);
            assert!(!vu::has_duplicates(&vector[@0x100]), 0);
            assert!(!vu::has_duplicates(&vector<address>[]), 0);
            assert!(vu::has_duplicates(&vector[@0x100, @0x100, @0x222, @0x333, @0x444]), 0);
            assert!(vu::has_duplicates(&vector[@0x222, @0x333, @0x100, @0x444, @0x100]), 0);
            assert!(vu::has_duplicates(&vector[@0x100, @0x100]), 0);
        };
    }

    #[test]
    fun test_intersect()
    {
        test_scenario::begin(&@0x1); {
            assert!(!vu::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x11, @0x22, @0x33],
            ), 0);
            assert!(!vu::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x11],
            ), 0);
            assert!(!vu::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[],
            ), 0);
            assert!(vu::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x1,  @0x22, @0x33],
            ), 0);
            assert!(vu::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x11, @0x22, @0x3],
            ), 0);
            assert!(vu::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x2],
            ), 0);
        }
    }
}
