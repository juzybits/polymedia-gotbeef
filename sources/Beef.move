/// Create bets between 2 or more players. Includes escrow and voting functionality.
module beef::bet
{
    use std::vector;
    use sui::coin::{Self, Coin};
    use sui::object::{Self, Info};
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
        info: Info,
        phase: u8,
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

    /** Functions **/

    /// Anybody can define a new bet
    public entry fun create<T>(
        title: vector<u8>,
        quorum: u8,
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
        spec {
            // Assume there's no duplicates, because IDK how to express
            // such an abort condition in the function spec.
            assume !has_dup_players;
            assume !has_dup_judges;
        };

        assert!(player_len >= MIN_PLAYERS && player_len <= MAX_PLAYERS, E_INVALID_NUMBER_OF_PLAYERS);
        assert!(judge_len >= MIN_JUDGES && judge_len <= MAX_JUDGES, E_INVALID_NUMBER_OF_JUDGES);
        assert!(!vector::contains(&players, &admin_addr), E_ADMIN_CANT_BE_PLAYER);
        assert!(!has_dup_players, E_DUPLICATE_PLAYERS);
        assert!(!has_dup_judges, E_DUPLICATE_JUDGES);

        // TODO: deduplicate players and judges
        // TODO: E_JUDGES_CANT_BE_PLAYERS, E_INVALID_QUORUM

        let bet = Bet<T> {
            info: object::new(ctx),
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
    // TODO: unit tests
    public entry fun fund<T>(
        bet: &mut Bet<T>,
        player_coin:
        Coin<T>,
        ctx: &mut TxContext)
    {
        let player_addr = tx_context::sender(ctx);

        assert!(vector::contains(&bet.players, &player_addr), E_ONLY_PLAYERS_CAN_FUND);
        assert!(!vec_map::contains(&bet.funds, &player_addr), E_ALREADY_FUNDED);
        assert!(coin::value(&player_coin) >= bet.bet_size, E_FUNDS_BELOW_BET_SIZE);

        vec_map::insert(&mut bet.funds, player_addr, player_coin);

        // If all players have funded the Bet, move to the "vote" phase
        if (vec_map::size(&bet.funds) == vector::length(&bet.players)) {
            bet.phase = PHASE_VOTE;
        }
    }

    /// Judges can cast a vote for one of the player addresses
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
        // aborts_if players/judges have duplicates => can this be expressed here?
    }
}

/// Utility functions for vectors
module beef::vector_util
{
    use std::vector;

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
}

#[test_only]
module beef::bet_tests
{
    // use std::debug::print as print;
    use sui::sui::SUI;
    use sui::test_scenario as ts;
    use beef::bet::{Self, Bet};

    const TITLE: vector<u8> = b"Frazier vs Ali";
    const QUORUM: u8 = 2;
    const BET_SIZE: u64 = 5000;
    const ADMIN_ADDR: address = @0x777;
    const PLAYERS: vector<address> = vector[@0xA1, @0xA2];
    const JUDGES: vector<address> = vector[@0xB1, @0xB2];

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

    // #[test, expected_failure(abort_code = 0)]
    // fun test_create_judges_cant_be_players() // TODO
    // {
    //     let players = vector[@0xA1, @0xA2, @0xB1];
    //     let scen = &mut ts::begin(&ADMIN_ADDR); {
    //         bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
    //     };
    // }

    #[test, expected_failure(abort_code = 1)]
    fun test_create_admin_cant_be_player()
    {
        let players = vector[@0xA1, @0xA2, ADMIN_ADDR];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, players, JUDGES, ts::ctx(scen) );
        };
    }

    #[test, expected_failure(abort_code = 2)]
    fun test_create_invalid_number_of_players()
    {
        let players = vector[@0xA1];
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
        let judges = vector[@0xAAA, @0x777, @0xAAA];
        let scen = &mut ts::begin(&ADMIN_ADDR); {
            bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, judges, ts::ctx(scen) );
        };
    }

    // #[test, expected_failure(abort_code = 6)]
    // fun test_create_invalid_quorum() // TODO
    // {
    //     let scen = &mut ts::begin(&ADMIN_ADDR); {
    //         bet::create<SUI>( TITLE, QUORUM, BET_SIZE, PLAYERS, JUDGES, ts::ctx(scen) );
    //     };
    // }
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
}
