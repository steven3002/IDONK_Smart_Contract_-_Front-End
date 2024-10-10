#![cfg_attr(not(any(feature = "export-abi", test)), no_main)]
extern crate alloc;

use stylus_sdk::{ prelude::*, block, alloy_primitives::{ Address, U8, U32 } };

// Solana Storage
sol_storage! {
    #[entrypoint]
    pub struct ContentState {
        mapping(uint8 => Content) contents; 
        mapping(uint8 => ContentInCommunity[]) community_contents; // Store list of content IDs for each community
    }

    pub struct Content {
        uint8 content_id;
        address author;
        string sub_data;
        string content_data;
        uint8 community_id; // 0 = Global, > 0 = Community ID
        bool verified;
        uint32 timestamp;
    }

    pub struct ContentInCommunity {
        uint8 content_id;
    }
}

#[public]
impl ContentState {
    pub fn submit_content(
        &mut self,
        author: Address,
        sub_data: String,
        content_data: String,
        community_id: u8,
        content_id: u8
    ) {
        // Set content details
        let mut new_content = self.contents.setter(U8::from(content_id));
        new_content.content_id.set(U8::from(content_id));
        new_content.author.set(author);
        new_content.sub_data.set_str(sub_data);
        new_content.content_data.set_str(content_data);
        new_content.community_id.set(U8::from(community_id));
        new_content.verified.set(false);
        new_content.timestamp.set(U32::from(block::timestamp()));

        // Add to community or global list
        let community_key = if community_id > 0 { U8::from(community_id) } else { U8::from(0) }; // 0 for global
        let mut content_list = self.community_contents.setter(community_key);
        let mut new_entry = content_list.grow();
        new_entry.content_id.set(U8::from(content_id));
    }

    // Retrieve content by content_id
    pub fn get_content(&self, content_id: u8) -> String {
        let content_x = self.contents.get(U8::from(content_id));
        return format!(
            r#"{{"content_id":{},"author":"{}","sub_data":"{}","content":"{}","community_id":{},"verified":{},"timestamp":{}}}"#,
            content_id,
            content_x.author.get(),
            content_x.sub_data.get_string(),
            content_x.content_data.get_string(),
            content_x.community_id.get(),
            content_x.verified.get(),
            content_x.timestamp.get()
        );
    }

    // Retrieve all content in a community (or global if community_id = 0)
    pub fn get_content_by_community(&self, community_id: u8) -> Vec<String> {
        let community_key = if community_id > 0 { U8::from(community_id) } else { U8::from(0) };
        let community_content = self.community_contents.get(community_key);

        let mut info = vec![];
        for i in 0..community_content.len() {
            if let Some(entry) = community_content.get(i) {
                let content_x = self.contents.get(entry.content_id.get());
                info.push(
                    format!(
                        r#"{{"content_id":{},"author":"{}","sub_data":"{}","verified":{},"timestamp":{}}}"#,
                        entry.content_id.get(),
                        content_x.author.get(),
                        content_x.sub_data.get_string(),
                        content_x.verified.get(),
                        content_x.timestamp.get()
                    )
                );
            }
        }

        info
    }

    // Verify content
    pub fn verify_content(&mut self, content_id: u8) {
        let mut content_x = self.contents.setter(U8::from(content_id));
        content_x.verified.set(true);
    }
}
