/// Utility functions for vectors
module gotbeef::vectors
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
module gotbeef::vectors_tests
{
    use sui::test_scenario;
    use gotbeef::vectors as v;

    #[test]
    fun test_has_duplicates()
    {
        test_scenario::begin(&@0x1); {
            assert!(!v::has_duplicates(&vector[@0x100, @0x222, @0x333, @0x444]), 0);
            assert!(!v::has_duplicates(&vector[@0x100]), 0);
            assert!(!v::has_duplicates(&vector<address>[]), 0);
            assert!(v::has_duplicates(&vector[@0x100, @0x100, @0x222, @0x333, @0x444]), 0);
            assert!(v::has_duplicates(&vector[@0x222, @0x333, @0x100, @0x444, @0x100]), 0);
            assert!(v::has_duplicates(&vector[@0x100, @0x100]), 0);
        };
    }

    #[test]
    fun test_intersect()
    {
        test_scenario::begin(&@0x1); {
            assert!(!v::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x11, @0x22, @0x33],
            ), 0);
            assert!(!v::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x11],
            ), 0);
            assert!(!v::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[],
            ), 0);
            assert!(v::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x1,  @0x22, @0x33],
            ), 0);
            assert!(v::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x11, @0x22, @0x3],
            ), 0);
            assert!(v::intersect(
                &vector[@0x1,  @0x2,  @0x3],
                &vector[@0x2],
            ), 0);
        }
    }
}
