#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
// written by Steven Hert, omo this code needs to be formated after the competition, rushing to meet up with time

extern crate alloc;
use stylus_sdk::{ prelude::*, stylus_proc::entrypoint };
use stylus_sdk::{ console, msg, alloy_primitives::{ Address, U8, U256 }, contract };

use stylus_sdk::call::Call;

// #[global_allocator]
// static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

sol_storage! {
 #[entrypoint]
 pub struct Test{
    address vote_contract;
    address communities;
    address erc20;
    address user_profile_address;
    // address reward;
 } 
}

sol_interface! {
    
    interface IVotesState {
        function setProfileAddress(address _address) external;
    
        function setRewardAddress(address _address) external;
    
        function voteContent(uint8 content_id, int8 vote, address voter, uint256 stake) external;
    
        function getVoters(uint8 content_id) external view returns (string[] memory);
    
        function getTotalVotes(uint8 content_id) external view returns (string memory);
    }
    
    
    interface ICommunityState {
        function createCommunity(string calldata name, string calldata meta_data) external;

        function getCommunity(uint8 index) external view returns (string memory);

        function addUserToCommunity(uint8 community_id) external;

        function isAMember(uint8 index, address user) external view returns (bool);

        function nameTaken(string calldata name) external view returns (bool);

        function getLastIndex() external view returns (uint8);
    }
        
    interface IErc20 {
        function name() external pure returns (string memory);

        function symbol() external pure returns (string memory);

        function decimals() external pure returns (uint8);

        function totalSupply() external view returns (uint256);

        function balanceOf(address owner) external view returns (uint256);

        function transfer(address to, uint256 value) external returns (bool);

        function transferFrom(address from, address to, uint256 value) external returns (bool);

        function stakeControl(address from, uint256 value) external returns (bool);

        function approve(address spender, uint256 value) external returns (bool);

        function allowance(address owner, address spender) external view returns (uint256);

        function setAdmin(address admin) external;

        function setTransactionLimit(uint256 limit) external;

        function pause() external;

        function unpause() external;

        function isPaused() external view returns (bool);
    }


    interface IUsers {
        function setErc2OAddress(address _address) external;
    
        function registerUser(address _address) external;
    
        function hasRegistered(address user_address) external view returns (bool);
    
        function changeReputationState(address user_id, int64 points) external;
    
        function getProfile(address user_id) external view returns (string memory);
    
        function setMyStakes(address user, uint8 content_id) external;
    
        function setCommunity(address user, uint8 community_id) external;
    
        function getMyStakes(address user) external view returns (uint8[] memory);
    }

}

#[public]
impl Test {
    pub fn set_vote_address(&mut self, address: Address) {
        self.vote_contract.set(address);
    }

    pub fn set_community_address(&mut self, address: Address) {
        self.communities.set(address);
    }

    pub fn set_erc2o_address(&mut self, address: Address) {
        self.erc20.set(address);
    }

    pub fn set_profile_address(&mut self, address: Address) {
        self.user_profile_address.set(address);
    }

    // pub fn set_reward(&mut self, address: Address) {
    //     self.reward.set(address);
    // }

    pub fn vote_content(&mut self, community_index: u8, stake: U256, content_id: u8, vote: i8) {
        // so since community will be made from the outside,i will make the default index to be 0 and the first index of the community to be 1
        if community_index != 0 {
            if !self.is_a_member(community_index) {
                return;
            }
        }

        if !self.has_enough_balance(stake) {
            return;
        }

        self.set_self_admin();
        self.stake(stake);
        // self.trf_vote_reward(stake);
        self.add_my_stakes(content_id);
        self.vote_state(stake, vote, content_id);
    }
}

impl Test {
    pub fn is_a_member(&self, community_index: u8) -> bool {
        let user_address = msg::sender();
        let community_address = self.communities.get();
        let meta_date_contract = ICommunityState::new(community_address);
        let config = Call::new();
        meta_date_contract.is_a_member(config, community_index, user_address).expect("drat")
    }

    pub fn has_enough_balance(&self, stake: U256) -> bool {
        let user_address = msg::sender();
        let min_balance = U256::from(50);
        let balance_check = stake + min_balance;
        let erc20_address = self.erc20.get();
        let meta_date_contract = IErc20::new(erc20_address);
        let config = Call::new();
        let balance = meta_date_contract.balance_of(config, user_address).expect("drat");

        if balance < balance_check {
            return false;
        }
        return true;
    }

    // pub fn vote_ended(&self, content_id: u8) -> bool {
    //     let vote_address = self.vote_contract.get();
    //     let meta_data_contract = IVotesState::new(vote_address);
    //     let config = Call::new();

    //     let raw_data = meta_data_contract
    //         .get_total_votes(config, content_id)
    //         .expect("Failed to get total votes");

    //     match raw_data.parse::<i8>() {
    //         Ok(num) => {
    //             if num >= 15 || num <= -15 { true } else { false }
    //         }
    //         Err(_) => true,
    //     }
    // }

    pub fn stake(&mut self, stake: U256) {
        let user_address = msg::sender();
        let meta_date_contract = IErc20::new(*self.erc20);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .stake_control(config, user_address, stake)
            .expect("Failed to call on MetaDate_contract");
    }

    pub fn vote_state(&mut self, stake: U256, vote: i8, content_id: u8) {
        let author_id = msg::sender();
        let meta_date_contract = IVotesState::new(*self.vote_contract);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .vote_content(config, content_id, vote, author_id, stake)
            .expect("Failed to call on MetaDate_contract");
    }

    pub fn set_self_admin(&mut self) {
        let self_address = contract::address();
        let meta_date_contract = IErc20::new(*self.erc20);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .set_admin(config, self_address)
            .expect("Failed to call on MetaDate_contract");
    }

    // pub fn trf_vote_reward(&mut self, stake: U256) {
    //     let vt_rw = self.reward.get();
    //     let meta_date_contract = IErc20::new(*self.erc20);
    //     let config = Call::new_in(self);
    //     let _ = meta_date_contract
    //         .transfer(config, vt_rw, stake)
    //         .expect("Failed to call on MetaDate_contract");
    // }

    pub fn add_my_stakes(&mut self, content_id: u8) {
        let ct_rw = msg::sender();
        let meta_date_contract = IUsers::new(*self.user_profile_address);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .set_my_stakes(config, ct_rw, content_id)
            .expect("Failed to call on MetaDate_contract");
    }

    pub fn change_reputation_state(&mut self, points: i64) {
        let ct_rw = msg::sender();
        let meta_date_contract = IUsers::new(*self.user_profile_address);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .change_reputation_state(config, ct_rw, points)
            .expect("Failed to call on MetaDate_contract");
    }
}
