module gotbeef::vote
{
    use std::option::{Self, Option};
    use std::vector;
    use sui::vec_map::{Self, VecMap};
    use gotbeef::vectors;

    // create_vote() errors
    const E_CHOICES_TOO_LOW: u64 = 100;
    const E_CHOICES_TOO_HIGH: u64 = 101;
    const E_CHOICES_DUPLICATE: u64 = 102;
    const E_JUDGES_TOO_LOW: u64 = 103;
    const E_JUDGES_TOO_HIGH: u64 = 104;
    const E_JUDGES_DUPLICATE: u64 = 105;
    const E_QUORUM_TOO_LOW: u64 = 106;
    const E_QUORUM_TOO_HIGH: u64 = 107;

    // create_vote() constraints
    const MIN_CHOICES: u64 = 2;
    const MAX_CHOICES: u64 = 256;
    const MIN_JUDGES: u64 = 1;
    const MAX_JUDGES: u64 = 32;

    struct Vote<Choice> {
        choices: vector<Choice>,
        judges: vector<address>,
        quorum: u64,
        votes: VecMap<address, Choice>,
        winner: Option<address>,
        // most_votes: u64, // number of votes received by the leading Choice - to detect stalemates
        // is_stalemate: boolean,
    }

    public fun create_vote<Choice>(
        choices: vector<Choice>,
        judges: vector<address>,
        quorum: u64,
    ): Vote<Choice>
    {
        let choices_len = vector::length(&choices);
        let judges_len = vector::length(&judges);
        assert!( choices_len >= MIN_CHOICES, E_CHOICES_TOO_LOW );
        assert!( choices_len <= MAX_CHOICES, E_CHOICES_TOO_HIGH );
        assert!( judges_len >= MIN_JUDGES, E_JUDGES_TOO_LOW );
        assert!( judges_len <= MAX_JUDGES, E_JUDGES_TOO_HIGH );
        assert!( !vectors::has_duplicates(&choices), E_CHOICES_DUPLICATE );
        assert!( !vectors::has_duplicates(&judges), E_JUDGES_DUPLICATE );
        assert!( quorum > 0, E_QUORUM_TOO_LOW );
        assert!( quorum <= judges_len, E_QUORUM_TOO_HIGH );

        Vote<Choice> {
            choices,
            judges,
            quorum,
            votes: vec_map::empty(),
            winner: option::none(),
        }
    }

    // TODO vote()
    // TODO winner()
    // TODO is_stalemate()
}