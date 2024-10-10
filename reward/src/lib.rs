#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use alloy_primitives::{ Address, U8, I8, U256, I32, U32 };
use stylus_sdk::{ prelude::*, msg, block };

use stylus_sdk::call::Call;

// this is the time overlay for each vote, that causes stakers to not claim reward (spam claim);
const TIMEDELAY: u32 = 5 * 60;

sol_storage! {
    #[entrypoint]
    pub struct RewardState {
        mapping(uint8 => Votes[]) voters;
        mapping(uint8 => MetaData) content_vote;
        address erc20;
        
    }

    pub struct Votes{
        address user_id;
        uint256 stake;
        int8 vote;
        bool rewarded;
    }

    pub struct MetaData{
        int32 total_votes;
        uint32 time_stamp;
    }
}

sol_interface! {
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

        function mint(uint256 value) external;

        function mintTo(address to, uint256 value) external;
    
    }
}

#[public]
impl RewardState {
    pub fn set_erc2o_address(&mut self, address: Address) {
        self.erc20.set(address);
    }

    pub fn vote_content(&mut self, content_id: u8, vote: i8, voter: Address, stake: U256) {
        // votes is int and not uint because we are to represent upvote as 1 and down vote as -1
        let mut content = self.voters.setter(U8::from(content_id));

        let mut vote_x = content.grow();
        vote_x.user_id.set(voter);
        vote_x.stake.set(stake);
        vote_x.vote.set(I8::unchecked_from(vote));

        let mut metatdata_x = self.content_vote.setter(U8::from(content_id));
        metatdata_x.time_stamp.set(U32::from(block::timestamp()));
        let total_vote = metatdata_x.total_votes.get();
        let calculated_vote = total_vote + I32::unchecked_from(vote);

        metatdata_x.total_votes.set(calculated_vote);
    }

    pub fn get_reward(&mut self, content_id: u8) {
        if self.is_rewarded(content_id) {
            return;
        }

        if !self.can_be_rewarded(content_id) {
            return;
        }

        let total_votes = self.content_vote.get(U8::from(content_id)).total_votes.get();
        if total_votes >= I32::unchecked_from(2) {
            self.reward(content_id, 1);
        } else if total_votes <= I32::unchecked_from(-2) {
            self.reward(content_id, 0);
        }
    }

    pub fn is_rewarded(&self, content_id: u8) -> bool {
        let voter_y = msg::sender();
        let voter_x = self.voters.get(U8::from(content_id));
        for inx in 0..voter_x.len() {
            let voter = voter_x.get(inx).unwrap();
            if voter.user_id.get() == voter_y {
                return voter.rewarded.get();
            }
        }
        return true;
    }

    pub fn can_be_rewarded(&self, content_id: u8) -> bool {
        let current_time_stamp = U32::from(block::timestamp());
        let old_time = self.content_vote.get(U8::from(content_id)).time_stamp.get();
        let over_lap_time = U32::from(TIMEDELAY) + old_time;
        if current_time_stamp >= over_lap_time {
            return true;
        }
        false
    }

    pub fn my_vote(&self, content_id: u8) -> String {
        let voter_y = msg::sender();
        let mut result = String::from("0");
        let voter_x = self.voters.get(U8::from(content_id));
        for inx in 0..voter_x.len() {
            let voter = voter_x.get(inx).unwrap();
            if voter.user_id.get() == voter_y {
                let my_vote_x = voter.vote.get();
                result = format!("{}", my_vote_x);
            }
        }
        return result;
    }
}

impl RewardState {
    pub fn reward(&mut self, content_id: u8, winner: u8) {
        let mut content = self.voters.setter(U8::from(content_id));
        let mut reward_data = U256::from(0);

        for index in 0..content.len() {
            let mut vote_x = content.get_mut(index).unwrap();
            let address_re = vote_x.user_id.get();

            if msg::sender() == address_re {
                let stake = vote_x.stake.get();
                vote_x.rewarded.set(true);

                let (multiplier, addition) = if
                    (winner == 0 && vote_x.vote.get() == I8::unchecked_from(-1)) || // Losing vote case
                    (winner == 1 && vote_x.vote.get() == I8::unchecked_from(1)) // Winning vote case
                {
                    (12, true)
                } else {
                    (7, false)
                };

                let rd = stake * U256::from(multiplier);
                let re = rd / U256::from(100);
                reward_data = if addition {
                    stake + re
                } else {
                    if re > stake { U256::from(0) } else { stake - re }
                };

                break;
            }
        }

        self.trf_vote_reward(reward_data, msg::sender());
    }

    pub fn trf_vote_reward(&mut self, reward: U256, address: Address) {
        let meta_date_contract = IErc20::new(*self.erc20);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .transfer(config, address, reward)
            .expect("Failed to call on MetaDate_contract");
    }
}
