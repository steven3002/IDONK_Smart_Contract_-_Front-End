#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use stylus_sdk::{ prelude::*, abi::Bytes, msg, alloy_primitives::Address };

sol_storage! {
    #[entrypoint]
    pub struct Users {
        mapping(address => User) users;
        mapping(string => bool) taken_names;
    }

    pub struct User{
        address user_id;
        string name;
        bytes meta_data;
        bool has_registered;
    }
}

#[public]
impl Users {
    pub fn register_user(&mut self, name: String, meta_data: Bytes) {
        let address = msg::sender();

        if self.has_meta_data() {
            return;
        }
        if self.name_taken(name.clone()) {
            return;
        }

        let mut new_user = self.users.setter(address);
        new_user.name.set_str(name.clone());
        new_user.user_id.set(address);
        new_user.has_registered.set(true);
        new_user.meta_data.set_bytes(meta_data);

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

    pub fn get_meta_data(&self) -> String {
        let user_id = msg::sender();
        let user = self.users.get(user_id);

        let formatted_string = format!(
            r#"{{"user_id":"{}","name":"{}","metaData":{:?}}}"#,
            user.user_id.get(),
            user.name.get_string(),
            user.meta_data.get_bytes()
        );

        formatted_string
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

    pub fn has_meta_data(&self) -> bool {
        let user_address = msg::sender();
        self.users.get(user_address).has_registered.get()
    }

    pub fn get_username(&self, address: Address) -> String {
        self.users.get(address).name.get_string()
    }
}
