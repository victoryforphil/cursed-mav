mod cmd_connect;
mod state;
pub mod helpers;
mod parameter_meta;

use crate::state::AppState;
use tauri::Manager;
use std::{sync::{Arc, Mutex}, fs};
use crate::state::MavConnState;
use tauri::path::BaseDirectory;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Log dir is cargo create dir + .cursed/logs/

    tauri::Builder::default()
        .setup(|app| {
            // Load parameter XML
            let resource_path = app.path().resolve("parameters/ardupilot.xml", BaseDirectory::Resource)?;
            let xml_str = fs::read_to_string(resource_path)?;
            
            // Parse parameters
            let parameters = parameter_meta::parse_parameters(&xml_str)?;
            
            // Initialize state with parameters
            app.manage(AppState(Arc::new(Mutex::new(MavConnState::new(parameters)))));

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            cmd_connect::connect_to_mav,
            cmd_connect::set_parameters,
            cmd_connect::get_parameter_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
