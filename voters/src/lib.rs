#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;
//  i will be using this fo semi call and all view
use alloy_primitives::{ Address, U8, I8, U256, U32, I32 };
use stylus_sdk::{ prelude::*, block };

use stylus_sdk::call::Call;

sol_storage! {
    #[entrypoint]
    pub struct VotesState {
        mapping(uint8 => Votes[]) voters;
        mapping(uint8 => MetaData) content_vote;
        address user_profile_address;
        address reward;
    }

    pub struct Votes{
        address user_id;
        uint256 stake;
        int8 vote;
        uint32 time_stamp;
    }

    pub struct MetaData{
        int32 total_votes;
        bool rewarded;

    }
}

sol_interface! {
    
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

    interface IRewardState {
        function setErc2OAddress(address _address) external;
    
        function voteContent(uint8 content_id, int8 vote, address voter, uint256 stake) external;
    
        function getReward(uint8 content_id) external;
    
        function isRewarded(uint8 content_id) external view returns (bool);
    }

}

#[public]
impl VotesState {
    pub fn set_profile_address(&mut self, address: Address) {
        self.user_profile_address.set(address);
    }
    pub fn set_reward_address(&mut self, address: Address) {
        self.reward.set(address);
    }

    pub fn vote_content(&mut self, content_id: u8, vote: i8, voter: Address, stake: U256) {
        // votes is int and not uint because we are to represent upvote as 1 and down vote as -1
        let mut content = self.voters.setter(U8::from(content_id));

        for index in 0..content.len() {
            // this is to makr sure you can only vote once
            if content.get(index).unwrap().user_id.get() == voter {
                return;
            }
        }

        let mut vote_x = content.grow();
        vote_x.user_id.set(voter);
        vote_x.stake.set(stake);
        vote_x.vote.set(I8::unchecked_from(vote));
        vote_x.time_stamp.set(U32::from(block::timestamp()));

        let mut metatdata_x = self.content_vote.setter(U8::from(content_id));
        let total_vote = metatdata_x.total_votes.get();
        let calculated_vote = total_vote + I32::unchecked_from(vote);

        metatdata_x.total_votes.set(calculated_vote);

        if let Some(author) = content.get(0) {
            let author_id = author.user_id.get();
            self.change_reputation_state(vote.into(), author_id);
        }

        self.reward_state(voter, stake, vote, content_id);
    }

    pub fn get_voters(&self, content_id: u8) -> Vec<String> {
        let content = self.voters.get(U8::from(content_id));
        let mut votes = vec![];
        for index in 0..content.len() {
            let vote_x = content.get(index).unwrap();
            // here you will notice that i am not passing the vote made by the user but only their stake
            // this is to make sure that the vote is not manipulated against the purpose of the platform
            votes.push(
                format!(
                    r#"{{"voters_id":"{}","stake":"{}","time_stamp":{}}}"#,
                    vote_x.user_id.get(),
                    vote_x.stake.get(),
                    vote_x.time_stamp.get()
                )
            );
        }
        votes
    }

    pub fn get_total_votes(&self, content_id: u8) -> String {
        let content = self.content_vote.get(U8::from(content_id));
        format!("{}", content.total_votes.get())
    }
}

impl VotesState {
    pub fn change_reputation_state(&mut self, points: i64, ct_rw: Address) {
        let meta_date_contract = IUsers::new(*self.user_profile_address);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .change_reputation_state(config, ct_rw, points)
            .expect("Failed to call on MetaDate_contract");
    }

    pub fn reward_state(&mut self, author_id: Address, stake: U256, vote: i8, content_id: u8) {
        let meta_date_contract = IRewardState::new(*self.reward);
        let config = Call::new_in(self);
        let _ = meta_date_contract
            .vote_content(config, content_id, vote, author_id, stake)
            .expect("Failed to call on MetaDate_contract");
    }
}
