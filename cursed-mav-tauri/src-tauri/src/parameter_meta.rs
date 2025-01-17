use std::collections::BTreeMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parameter {
    pub human_name: String,
    pub documentation: String,
    pub user: String,
    pub field_type: FieldType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FieldType {
    Range {
        min: f64,
        max: f64,
        increment: Option<f64>,
        units: Option<String>,
    },
    Bitmask(Vec<BitFlag>),
    Values(Vec<Value>),
    None,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BitFlag {
    pub code: u32,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Value {
    pub code: u32,
    pub name: String,
}

impl Parameter {
    pub fn validate_value(&self, value: &str) -> bool {
        match &self.field_type {
            FieldType::Range { min, max, .. } => {
                if let Ok(num) = value.parse::<f64>() {
                    return num >= *min && num <= *max;
                }
                false
            }
            FieldType::Bitmask(flags) => {
                if let Ok(num) = value.parse::<u32>() {
                    let max_flag = flags.iter().map(|f| f.code).max().unwrap_or(0);
                    return num <= (1 << max_flag);
                }
                false
            }
            FieldType::Values(values) => {
                if let Ok(num) = value.parse::<u32>() {
                    return values.iter().any(|v| v.code == num);
                }
                false
            }
            FieldType::None => true,
        }
    }
}

pub fn parse_parameters(xml_str: &str) -> Result<BTreeMap<String, Parameter>, Box<dyn std::error::Error>> {
    use quick_xml::events::Event;
    use quick_xml::reader::Reader;
    
    let mut reader = Reader::from_str(xml_str);
    reader.trim_text(true);
    
    let mut parameters = BTreeMap::new();
    let mut buf = Vec::new();
    
    let mut current_param: Option<(String, Parameter)> = None;
    let mut current_field_type: Option<FieldType> = None;
    
    loop {
        match reader.read_event_into(&mut buf) {
            Ok(Event::Start(ref e)) => {
                match e.name().as_ref() {
                    b"param" => {
                        let mut name = String::new();
                        let mut human_name = String::new();
                        let mut documentation = String::new();
                        let mut user = String::new();
                        
                        for attr in e.attributes().flatten() {
                            let key = std::str::from_utf8(attr.key.as_ref())?.to_owned();
                            let value = attr.unescape_value()?.into_owned();
                            
                            match key.as_str() {
                                "name" => {
                                    if value.starts_with("ArduCopter:") {
                                        name = value.replace("ArduCopter:", "");
                                    }
                                },
                                "humanName" => human_name = value,
                                "documentation" => documentation = value,
                                "user" => user = value,
                                _ => {}
                            }
                        }
                        
                        if !name.is_empty() {
                            current_param = Some((name, Parameter {
                                human_name,
                                documentation,
                                user,
                                field_type: FieldType::None,
                            }));
                        }
                    },
                    b"field" => {
                        let mut field_type = None;
                        let mut min = None;
                        let mut max = None;
                        let mut increment = None;
                        let mut units = None;
                        
                        for attr in e.attributes().flatten() {
                            let key = std::str::from_utf8(attr.key.as_ref())?.to_owned();
                            let value = attr.unescape_value()?.into_owned();
                            
                            match key.as_str() {
                                "name" => field_type = Some(value),
                                "Range" => {
                                    let parts: Vec<&str> = value.split_whitespace().collect();
                                    if parts.len() >= 2 {
                                        min = parts[0].parse().ok();
                                        max = parts[1].parse().ok();
                                    }
                                },
                                "Increment" => increment = value.parse().ok(),
                                "Units" => units = Some(value),
                                _ => {}
                            }
                        }
                        
                        if let Some(field_type) = field_type {
                            match field_type.as_str() {
                                "Range" => {
                                    if let (Some(min), Some(max)) = (min, max) {
                                        current_field_type = Some(FieldType::Range {
                                            min,
                                            max,
                                            increment,
                                            units,
                                        });
                                    }
                                },
                                _ => {}
                            }
                        }
                    },
                    b"values" => {
                        let mut values = Vec::new();
                        for attr in e.attributes().flatten() {
                            let value = attr.unescape_value()?.into_owned();
                            if let Some((code, name)) = value.split_once(':') {
                                if let Ok(code) = code.trim().parse() {
                                    values.push(Value {
                                        code,
                                        name: name.trim().to_string(),
                                    });
                                }
                            }
                        }
                        if !values.is_empty() {
                            current_field_type = Some(FieldType::Values(values));
                        }
                    },
                    b"bitmask" => {
                        let mut flags = Vec::new();
                        for attr in e.attributes().flatten() {
                            let value = attr.unescape_value()?.into_owned();
                            if let Some((code, name)) = value.split_once(':') {
                                if let Ok(code) = code.trim().parse() {
                                    flags.push(BitFlag {
                                        code,
                                        name: name.trim().to_string(),
                                    });
                                }
                            }
                        }
                        if !flags.is_empty() {
                            current_field_type = Some(FieldType::Bitmask(flags));
                        }
                    },
                    _ => {}
                }
            },
            Ok(Event::End(ref e)) => {
                match e.name().as_ref() {
                    b"param" => {
                        if let Some((name, mut param)) = current_param.take() {
                            if let Some(field_type) = current_field_type.take() {
                                param.field_type = field_type;
                            }
                            parameters.insert(name, param);
                        }
                    },
                    _ => {}
                }
            },
            Ok(Event::Eof) => break,
            Err(e) => return Err(Box::new(e)),
            _ => (),
        }
        buf.clear();
    }
    
    Ok(parameters)
} 