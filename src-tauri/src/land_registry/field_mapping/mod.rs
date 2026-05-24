use crate::land_registry::errors::LandRegistryError;
use serde::Deserialize;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::path::Path;

#[derive(Debug, Clone)]
pub struct ApiFieldSchema;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AutomationState {
    FilledFromRegistry,
    MappingGap,
    IntegrationGap,
    ManualRequired,
    NotSupported,
}

#[derive(Debug, Clone)]
pub struct FieldMappingConfig {
    pub schema_version: u32,
    pub apis: HashMap<String, ApiMapping>,
    pub service_mappings: HashMap<String, ServiceFieldMapping>,
}

#[derive(Debug, Clone)]
pub struct ApiMapping {
    pub target_field: String,
    pub json_path: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ServiceFieldMapping {
    pub service_code: String,
    pub source_payload_path: String,
    pub target_field_key: String,
    pub field_source_matrix_row: String,
    pub automation_state: AutomationState,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MappingGap {
    pub service_code: String,
    pub source_payload_path: String,
    pub target_field_key: String,
    pub field_source_matrix_row: String,
    pub automation_state: AutomationState,
    pub reason: String,
}

#[derive(Debug, Clone, Default, PartialEq)]
pub struct MappingTranslation {
    pub mapped_fields: HashMap<String, Value>,
    pub gaps: Vec<MappingGap>,
}

const IMPLEMENTED_SERVICE_CODES: &[&str] = &[
    "MOI_API_001",
    "MOI_API_002",
    "MOI_API_003",
    "MOI_API_004",
    "MOI_API_005",
    "MOI_API_006",
    "MOI_API_007",
    "MOI_API_009",
    "MOI_API_013",
    "MOI_API_014",
    "MOI_API_015",
    "MOI_API_016",
    "MOI_API_017",
    "MOI_API_023",
    "MOI_API_026",
    "MOI_API_028",
    "MOI_API_036",
    "MOI_API_041",
    "MOI_API_043",
];

#[derive(Debug, Deserialize)]
struct RawConfig {
    schema_version: Option<u32>,
    apis: Option<HashMap<String, RawApiMapping>>,
    mappings: Option<HashMap<String, RawServiceMapping>>,
}

#[derive(Debug, Deserialize)]
struct RawApiMapping {
    target_field: String,
    json_path: String,
}

#[derive(Debug, Deserialize)]
struct RawServiceMapping {
    service_code: String,
    source_payload_path: String,
    target_field_key: String,
    field_source_matrix_row: String,
    automation_state: String,
}

impl FieldMappingConfig {
    pub fn load_from_path(path: impl AsRef<Path>) -> Result<Self, LandRegistryError> {
        let s = std::fs::read_to_string(path).map_err(|e| LandRegistryError::Internal {
            message: format!("failed to read config: {e}"),
        })?;
        Self::from_toml_str(&s)
    }

    pub fn from_toml_str(s: &str) -> Result<Self, LandRegistryError> {
        let raw: RawConfig = toml::from_str(s).map_err(|e| LandRegistryError::Internal {
            message: format!("toml parse failed: {e}"),
        })?;

        let schema_version = raw.schema_version.unwrap_or(1);
        if schema_version != 1 && schema_version != 2 {
            return Err(LandRegistryError::Internal {
                message: format!("unsupported schema_version: {schema_version}"),
            });
        }

        let apis_raw = raw.apis.unwrap_or_default();
        let mut apis: HashMap<String, ApiMapping> = HashMap::new();
        let mut target_fields: HashSet<String> = HashSet::new();

        for (api_id, mapping) in apis_raw {
            if !target_fields.insert(mapping.target_field.clone()) {
                return Err(LandRegistryError::Internal {
                    message: format!("duplicate target_field: {}", mapping.target_field),
                });
            }
            apis.insert(
                api_id.to_lowercase(),
                ApiMapping {
                    target_field: mapping.target_field,
                    json_path: mapping.json_path,
                },
            );
        }

        let mut service_mappings: HashMap<String, ServiceFieldMapping> = HashMap::new();
        let mut service_target_fields: HashSet<String> = HashSet::new();

        for (service_code, mapping) in raw.mappings.unwrap_or_default() {
            let normalized_service_code = service_code.to_lowercase();
            let automation_state = parse_automation_state(&mapping.automation_state)?;
            if !service_target_fields.insert(mapping.target_field_key.clone()) {
                return Err(LandRegistryError::Internal {
                    message: format!("duplicate target_field_key: {}", mapping.target_field_key),
                });
            }
            service_mappings.insert(
                normalized_service_code,
                ServiceFieldMapping {
                    service_code: mapping.service_code,
                    source_payload_path: mapping.source_payload_path,
                    target_field_key: mapping.target_field_key,
                    field_source_matrix_row: mapping.field_source_matrix_row,
                    automation_state,
                },
            );
        }

        Ok(FieldMappingConfig {
            schema_version,
            apis,
            service_mappings,
        })
    }
}

#[derive(Debug, Clone)]
pub struct FieldMapper {
    config: FieldMappingConfig,
}

impl FieldMapper {
    pub fn new(config: FieldMappingConfig) -> Self {
        Self { config }
    }

    pub fn load_from_path(path: impl AsRef<Path>) -> Result<Self, LandRegistryError> {
        Ok(Self::new(FieldMappingConfig::load_from_path(path)?))
    }

    pub fn get_target_field(&self, api_id: &str) -> Option<&str> {
        let k = api_id.to_lowercase();
        self.config.apis.get(&k).map(|m| m.target_field.as_str())
    }

    pub fn get_service_mapping(&self, service_code: &str) -> Option<&ServiceFieldMapping> {
        self.config.service_mappings.get(&service_code.to_lowercase())
    }

    pub fn translate_response(
        &self,
        service_code: &str,
        payload: &Value,
    ) -> MappingTranslation {
        let Some(mapping) = self.get_service_mapping(service_code) else {
            return MappingTranslation {
                mapped_fields: HashMap::new(),
                gaps: vec![MappingGap {
                    service_code: service_code.to_string(),
                    source_payload_path: String::new(),
                    target_field_key: String::new(),
                    field_source_matrix_row: String::new(),
                    automation_state: AutomationState::IntegrationGap,
                    reason: format!("missing client for {service_code}"),
                }],
            };
        };

        if !IMPLEMENTED_SERVICE_CODES
            .iter()
            .any(|implemented| implemented.eq_ignore_ascii_case(&mapping.service_code))
        {
            return MappingTranslation {
                mapped_fields: HashMap::new(),
                gaps: vec![MappingGap {
                    service_code: mapping.service_code.clone(),
                    source_payload_path: mapping.source_payload_path.clone(),
                    target_field_key: mapping.target_field_key.clone(),
                    field_source_matrix_row: mapping.field_source_matrix_row.clone(),
                    automation_state: AutomationState::IntegrationGap,
                    reason: format!("missing local client for {}", mapping.service_code),
                }],
            };
        }

        let mut translation = MappingTranslation::default();
        match resolve_json_path(payload, &mapping.source_payload_path) {
            Some(value) => {
                translation
                    .mapped_fields
                    .insert(mapping.target_field_key.clone(), value.clone());
            }
            None => {
                translation.gaps.push(MappingGap {
                    service_code: mapping.service_code.clone(),
                    source_payload_path: mapping.source_payload_path.clone(),
                    target_field_key: mapping.target_field_key.clone(),
                    field_source_matrix_row: mapping.field_source_matrix_row.clone(),
                    automation_state: AutomationState::MappingGap,
                    reason: format!(
                        "payload field {} was not found for {}",
                        mapping.source_payload_path, mapping.target_field_key
                    ),
                });
            }
        }
        translation
    }
}

pub fn resolve_json_path<'a>(json: &'a Value, path: &str) -> Option<&'a Value> {
    let path = path.strip_prefix("$.")?;
    let mut cur = json;
    for seg in path.split('.') {
        cur = cur.get(seg)?;
    }
    Some(cur)
}

fn parse_automation_state(value: &str) -> Result<AutomationState, LandRegistryError> {
    match value {
        "filled_from_registry" => Ok(AutomationState::FilledFromRegistry),
        "mapping_gap" => Ok(AutomationState::MappingGap),
        "integration_gap" => Ok(AutomationState::IntegrationGap),
        "manual_required" => Ok(AutomationState::ManualRequired),
        "not_supported" => Ok(AutomationState::NotSupported),
        other => Err(LandRegistryError::Internal {
            message: format!("unsupported automation_state: {other}"),
        }),
    }
}

pub mod tests;
