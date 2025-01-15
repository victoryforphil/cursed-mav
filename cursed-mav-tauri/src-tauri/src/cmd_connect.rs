use log::{info, LevelFilter};
use mavlink::{error::MessageReadError, MavConnection, MavHeader};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, sync::{Arc, Mutex}, time::Duration};
use tauri::{ipc::Channel, AppHandle, Emitter, State};
use crate::helpers::MavLinkHelper;
use crate::state::AppState;
use crate::parameter_meta::{Parameter, FieldType};

pub type MavlinkMessageType = mavlink::ardupilotmega::MavMessage;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum ConnectUpdate {
    Connected,
    Disconnected { reason: String },
    Connecting { connection_time: u32, retries: u32 },
    Failed { reason: String },
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParamChange {
    pub param_name: String,
    pub new_value: f32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParameterInfo {
    pub name: String,
    pub human_name: String,
    pub documentation: String,
    pub user: String,
    pub field_type: ParameterFieldInfo,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase", tag = "type", content = "data")]
pub enum ParameterFieldInfo {
    Range {
        min: f64,
        max: f64,
        increment: Option<f64>,
        units: Option<String>,
    },
    Bitmask {
        flags: Vec<BitFlagInfo>
    },
    Values {
        values: Vec<ValueInfo>
    },
    None
}

#[derive(Serialize)]
pub struct BitFlagInfo {
    pub code: u32,
    pub name: String,
}

#[derive(Serialize)]
pub struct ValueInfo {
    pub code: u32,
    pub name: String,
}

#[tauri::command]
pub async fn connect_to_mav(
    app: AppHandle,
    state: State<'_, AppState>,
    url: String,
    on_event: Channel<ConnectUpdate>,
) -> Result<(), String> {
    let start_time = std::time::Instant::now();
    let mut retries = 0;
    const MAX_RETRIES: u32 = 30;

    loop {
        let elapsed = start_time.elapsed().as_secs() as u32;
        on_event
            .send(ConnectUpdate::Connecting {
                connection_time: elapsed,
                retries,
            })
            .map_err(|e| e.to_string())?;

        info!(
            "Mavlink // Connect // Connecting to: {} (Attempt {})",
            url,
            retries + 1
        );

        match mavlink::connect::<MavlinkMessageType>(&url) {
            Ok(mut mav_con) => {
                info!("Mavlink // Connect // Connected successfully");
                on_event
                    .send(ConnectUpdate::Connected)
                    .map_err(|e| e.to_string())?;
                info!("Mavlink // Connect // Sending initial settings");

                mav_con.set_protocol_version(mavlink::MavlinkVersion::V2);

                // Send initial configuration
                if let Err(e) = mav_con.send(
                    &mavlink::MavHeader::default(),
                    &MavLinkHelper::request_parameters(),
                ) {
                    on_event
                        .send(ConnectUpdate::Failed {
                            reason: format!("Failed to send parameters request: {}", e),
                        })
                        .map_err(|e| e.to_string())?;
                    return Err("Failed to send parameters request".to_string());
                }

                // Send stream reqeust
                if let Err(e) = mav_con.send(
                    &mavlink::MavHeader::default(),
                    &MavLinkHelper::request_stream(),
                ) {
                    on_event
                        .send(ConnectUpdate::Failed {
                            reason: format!("Failed to send stream request: {}", e),
                        })
                        .map_err(|e| e.to_string())?;
                }
                // Send heartbeat
                info!("Mavlink // Connect // Sending heartbeat");

                let mav_con = Arc::new(mav_con);
                
                // Store reference in state
                {
                    let mut app_state = state.0.lock().unwrap();
                    app_state.connection = Some(mav_con.clone());
                }

                tokio::spawn(send_heartbeat(mav_con.clone()));
                tokio::spawn(recv_messages(app.clone(), mav_con.clone()));
                tokio::spawn(send_param_request(mav_con.clone()));

                return Ok(());
            }
            Err(e) => {
                retries += 1;
                if retries >= MAX_RETRIES {
                    let error_msg =
                        format!("Failed to connect after {} attempts: {}", MAX_RETRIES, e);
                    on_event
                        .send(ConnectUpdate::Failed {
                            reason: error_msg.clone(),
                        })
                        .map_err(|e| e.to_string())?;
                    return Err(error_msg);
                }
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        }
    }
}

async fn send_heartbeat(vehicle: Arc<Box<dyn MavConnection<MavlinkMessageType> + Send + Sync>>) {
    loop {
        let res: Result<usize, mavlink::error::MessageWriteError> =
            vehicle.send_default(&MavLinkHelper::heartbeat_message());
        if res.is_ok() {
            info!("Mavlink // Connect // Heartbeat sent");
            tokio::time::sleep(Duration::from_secs(1)).await;
        } else {
            info!("Mavlink // Connect // Heartbeat send failed: {:?}", res);
        }
    }
}

async fn send_param_request(vehicle: Arc<Box<dyn MavConnection<MavlinkMessageType> + Send + Sync>>) {
    loop {
        let res: Result<usize, mavlink::error::MessageWriteError> =
            vehicle.send_default(&MavLinkHelper::request_parameters());
        if res.is_ok() {
            info!("Mavlink // Connect // Parameter request sent");
        } else {
            info!("Mavlink // Connect // Parameter request failed: {:?}", res);
        }
        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}

#[derive(Clone, Serialize, Debug)]
pub struct MavlinkMessage {
    pub header: MavHeader,
    pub message: MavlinkMessageType,
}

async fn recv_messages(
    app: AppHandle,
    vehicle: Arc<Box<dyn MavConnection<MavlinkMessageType> + Send + Sync>>,
) {
    loop {
        match vehicle.recv() {
            Ok((header, msg)) => {
                let mavlink_message = MavlinkMessage {
                    header,
                    message: msg,
                };
                let _ = app.emit("mavlink_message", mavlink_message);
            }
            Err(MessageReadError::Io(e)) => {
                if e.kind() == std::io::ErrorKind::WouldBlock {
                    tokio::time::sleep(Duration::from_secs(1)).await;
                    info!("Mavlink // Connect // No messages currently available to receive -- wait a while");
                } else {
                    println!("recv error: {e:?}");
                }
            }
            _ => {}
        }
    }
}

#[tauri::command]
pub async fn set_parameters(
    state: State<'_, AppState>,
    changes: Vec<ParamChange>,
) -> Result<(), String> {
    let app_state = state.0.lock().unwrap();
    let Some(conn) = &app_state.connection else {
        return Err("No active MavConnection. Call connect_to_mav first.".into());
    };
    let conn = conn.clone();

    for change in changes {
        let mut param_id = [0u8; 16];
        let bytes = change.param_name.as_bytes();
        let copy_len = bytes.len().min(16);
        param_id[..copy_len].copy_from_slice(&bytes[..copy_len]);

        let param_msg = mavlink::ardupilotmega::MavMessage::PARAM_SET(
            mavlink::ardupilotmega::PARAM_SET_DATA {
                param_value: change.new_value,
                target_system: 1,
                target_component: 1,
                param_id,
                ..Default::default()
            },
        );

        if let Err(e) = conn.send(&mavlink::MavHeader::default(), &param_msg) {
            return Err(format!("Failed to send param {} update: {}", change.param_name, e));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_parameter_info(
    state: State<'_, AppState>,
    param_name: String,
) -> Result<Option<ParameterInfo>, String> {
    let app_state = state.0.lock().unwrap();
    
    // Look up parameter in state
    if let Some(param) = app_state.parameters.get(&param_name) {
        let field_info = match &param.field_type {
            FieldType::Range { min, max, increment, units } => {
                ParameterFieldInfo::Range {
                    min: *min,
                    max: *max,
                    increment: *increment,
                    units: units.clone(),
                }
            },
            FieldType::Bitmask(flags) => {
                ParameterFieldInfo::Bitmask {
                    flags: flags.iter().map(|f| BitFlagInfo {
                        code: f.code,
                        name: f.name.clone()
                    }).collect()
                }
            },
            FieldType::Values(values) => {
                ParameterFieldInfo::Values {
                    values: values.iter().map(|v| ValueInfo {
                        code: v.code,
                        name: v.name.clone()
                    }).collect()
                }
            },
            FieldType::None => ParameterFieldInfo::None
        };

        Ok(Some(ParameterInfo {
            name: param_name,
            human_name: param.human_name.clone(),
            documentation: param.documentation.clone(),
            user: param.user.clone(),
            field_type: field_info,
        }))
    } else {
        Ok(None)
    }
}
#[tauri::command]
pub async fn get_all_parameters(state: State<'_, AppState>) -> Result<BTreeMap<String, ParameterInfo>, String> {
    let state = state.0.lock().map_err(|e| e.to_string())?;
    
    // Convert the entire parameter map to ParameterInfo map
    let param_map = state.parameters.iter().map(|(name, param)| {
        let field_type = match &param.field_type {
            FieldType::Range { min, max, increment, units } => {
                ParameterFieldInfo::Range {
                    min: *min,
                    max: *max,
                    increment: *increment,
                    units: units.clone(),
                }
            },
            FieldType::Bitmask(flags) => {
                ParameterFieldInfo::Bitmask {
                    flags: flags.iter().map(|f| BitFlagInfo {
                        code: f.code,
                        name: f.name.clone(),
                    }).collect(),
                }
            },
            FieldType::Values(values) => {
                ParameterFieldInfo::Values {
                    values: values.iter().map(|v| ValueInfo {
                        code: v.code,
                        name: v.name.clone(),
                    }).collect(),
                }
            },
            FieldType::None => ParameterFieldInfo::None,
        };

        (name.clone(), ParameterInfo {
            name: name.clone(),
            human_name: param.human_name.clone(),
            documentation: param.documentation.clone(),
            user: param.user.clone(),
            field_type,
        })
    }).collect();

    Ok(param_map)
} 
