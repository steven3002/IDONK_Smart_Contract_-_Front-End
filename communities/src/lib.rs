#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use alloy_primitives::{ Address, U8, U32 };
use stylus_sdk::{ prelude::*, block, msg };

sol_storage! {
    #[entrypoint]
    pub struct CommunityState {
        mapping( uint8 => Community) communities;
        mapping(string => bool) taken_names;
        uint8 old_index;
    }
    pub struct Community {
    address creator;
    string name;
    string  meta_data;
    uint32 created_at;
     address[] members;
    } 
}

#[public]
impl CommunityState {
    pub fn create_community(&mut self, name: String, meta_data: String) {
        if self.name_taken(name.clone()) {
            return;
        }
        let old_index = self.old_index.get();

        let new_index = old_index + U8::from(1);

        self.old_index.set(new_index);

        let creator = msg::sender();

        let available_index = new_index;

        let mut new_community = self.communities.setter(available_index);
        new_community.creator.set(creator);
        new_community.name.set_str(name.clone());
        new_community.meta_data.set_str(meta_data);
        new_community.created_at.set(U32::from(block::timestamp()));

        let name_bytes = name.as_bytes();
        let mut lowercase_name_x = String::with_capacity(name.len());

        for &byte in name_bytes {
            lowercase_name_x.push(
                if byte.is_ascii_uppercase() {
                    (byte + 32) as char
                } else {
                    byte as char
                }
            );
        }
        let mut taken_name = self.taken_names.setter(lowercase_name_x);
        taken_name.set(true);
    }

    pub fn get_community(&self, index: u8) -> String {
        let community = self.communities.get(U8::from(index));
        return format!(
            r#"{{"creator":"{}","name":"{}","meta_data":"{}","numbers of members":"{}","created_at":{}}}"#,
            community.creator.get(),
            community.name.get_string(),
            community.meta_data.get_string(),
            community.members.len(),
            community.created_at.get()
        );
    }

    pub fn add_user_to_community(&mut self, community_id: u8) {
        let user_id = msg::sender();
        if self.is_a_member(community_id, user_id) {
            return;
        }
        let mut community = self.communities.setter(U8::from(community_id));
        community.members.push(user_id);
    }

    pub fn is_a_member(&self, index: u8, user: Address) -> bool {
        let community = self.communities.get(U8::from(index));
        if community.creator.get() == user {
            return true;
        }
        for ix in 0..community.members.len() {
            if community.members.get(ix).unwrap() == user {
                return true;
            }
        }
        return false;
    }

    pub fn name_taken(&self, name: String) -> bool {
        let name_bytes = name.as_bytes();
        let mut lowercase_name_x = String::with_capacity(name.len());

        for &byte in name_bytes {
            lowercase_name_x.push(
                if byte.is_ascii_uppercase() {
                    (byte + 32) as char
                } else {
                    byte as char
                }
            );
        }
        self.taken_names.get(lowercase_name_x)
    }

    pub fn get_last_index(&self) -> u8 {
        let index = self.old_index.get();
        let result: u8 = index.to::<u8>();
        result
    }
}
