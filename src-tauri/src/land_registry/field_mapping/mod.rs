use crate::land_registry::errors::LandRegistryError;
use serde::Deserialize;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::path::Path;

#[derive(Debug, Clone)]
pub struct ApiFieldSchema;

#[derive(Debug, Clone)]
pub struct FieldMappingConfig {
    pub schema_version: u32,
    pub apis: HashMap<String, ApiMapping>,
}

#[derive(Debug, Clone)]
pub struct ApiMapping {
    pub target_field: String,
    pub json_path: String,
}

#[derive(Debug, Deserialize)]
struct RawConfig {
    schema_version: Option<u32>,
    apis: Option<HashMap<String, RawApiMapping>>,
}

#[derive(Debug, Deserialize)]
struct RawApiMapping {
    target_field: String,
    json_path: String,
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
        if schema_version != 1 {
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

        Ok(FieldMappingConfig {
            schema_version,
            apis,
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
}

pub fn resolve_json_path<'a>(json: &'a Value, path: &str) -> Option<&'a Value> {
    let path = path.strip_prefix("$.")?;
    let mut cur = json;
    for seg in path.split('.') {
        cur = cur.get(seg)?;
    }
    Some(cur)
}

pub mod tests;
