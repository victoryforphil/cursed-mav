use std::{collections::BTreeMap, sync::{Arc, Mutex}};
use mavlink::MavConnection;
use crate::{cmd_connect::MavlinkMessageType, parameter_meta::Parameter};

#[derive(Default)]
pub struct MavConnState {
    pub connection: Option<Arc<Box<dyn MavConnection<MavlinkMessageType> + Send + Sync>>>,
    pub parameters: BTreeMap<String, Parameter>,
}

impl MavConnState {
    pub fn new(parameters: BTreeMap<String, Parameter>) -> Self {
        Self { 
            connection: None,
            parameters,
        }
    }
}

#[derive(Default)]
pub struct AppState(pub Arc<Mutex<MavConnState>>); 