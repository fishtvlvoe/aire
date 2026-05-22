use crate::land_registry::errors::LandRegistryError;
use quick_xml::events::Event;
use quick_xml::Reader;
use reqwest::Url;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct NlscLandCandidate {
    pub content: String,
    pub location: String,
    pub office: String,
    pub section: String,
    pub land_no: String,
    pub source: String,
    pub trusted_for_pdf: bool,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NlscLandBuildingInfo {
    pub county: String,
    pub section: String,
    pub land_no: String,
    pub build_list: Vec<String>,
    pub owner_type: serde_json::Value,
    pub source: String,
    pub trusted_for_pdf: bool,
}

#[derive(Clone)]
pub struct NlscCadastralClient {
    base_url: String,
    http_client: reqwest::Client,
}

impl NlscCadastralClient {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into(),
            http_client: reqwest::Client::new(),
        }
    }

    pub async fn address_query_land(
        &self,
        address: &str,
        limit: usize,
    ) -> Result<Vec<NlscLandCandidate>, LandRegistryError> {
        let url = build_url(&self.base_url, &["idc", "AddressQueryLand", address, &limit.to_string()])?;
        let body = get_text(&self.http_client, url, "CAD_009").await?;
        parse_address_query_land_xml(&body)
    }

    pub async fn cadas_land_info(
        &self,
        county: &str,
        section: &str,
        land_no: &str,
    ) -> Result<NlscLandBuildingInfo, LandRegistryError> {
        let url = build_url(&self.base_url, &["dmaps", "CadasLandInfo", county, section, land_no])?;
        let body = get_text(&self.http_client, url, "CAD_011").await?;
        parse_cadas_land_info_json(county, section, land_no, &body)
    }
}

fn build_url(base_url: &str, segments: &[&str]) -> Result<Url, LandRegistryError> {
    let mut url = Url::parse(base_url).map_err(|error| LandRegistryError::Internal {
        message: format!("invalid NLSC base URL: {error}"),
    })?;
    {
        let mut path = url
            .path_segments_mut()
            .map_err(|_| LandRegistryError::Internal {
                message: "NLSC base URL cannot be a base".to_string(),
            })?;
        path.clear();
        for segment in segments {
            path.push(segment);
        }
    }
    Ok(url)
}

async fn get_text(
    http_client: &reqwest::Client,
    url: Url,
    api_id: &str,
) -> Result<String, LandRegistryError> {
    let response = http_client
        .get(url)
        .send()
        .await
        .map_err(|error| LandRegistryError::Network {
            message: format!("request failed for {api_id}"),
            source: Box::new(error),
        })?;

    let status = response.status().as_u16();
    let body = response.text().await.map_err(|error| LandRegistryError::Network {
        message: format!("read response failed for {api_id}"),
        source: Box::new(error),
    })?;

    if body.trim().eq_ignore_ascii_case("PERMISSION DENIED") {
        return Err(LandRegistryError::NlscPermissionDenied {
            message: format!("{api_id} returned PERMISSION DENIED with http_status={status}"),
        });
    }

    if !(200..300).contains(&status) {
        return Err(LandRegistryError::from_http_response(status, &body));
    }

    Ok(body)
}

pub fn parse_address_query_land_xml(
    xml: &str,
) -> Result<Vec<NlscLandCandidate>, LandRegistryError> {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);
    let mut candidates = Vec::new();
    let mut current: Option<NlscLandCandidate> = None;
    let mut current_tag = String::new();

    loop {
        match reader.read_event() {
            Ok(Event::Start(event)) => {
                let tag = String::from_utf8_lossy(event.name().as_ref()).to_string();
                if tag == "addressItem" {
                    current = Some(NlscLandCandidate {
                        content: String::new(),
                        location: String::new(),
                        office: String::new(),
                        section: String::new(),
                        land_no: String::new(),
                        source: "nlsc_cad".to_string(),
                        trusted_for_pdf: false,
                    });
                }
                current_tag = tag;
            }
            Ok(Event::Text(event)) => {
                if let Some(candidate) = current.as_mut() {
                    let text = event
                        .decode()
                        .map_err(|error| LandRegistryError::Internal {
                            message: format!("CAD_009 XML decode failed: {error}"),
                        })?
                        .into_owned();
                    match current_tag.as_str() {
                        "content" => candidate.content = text,
                        "location" => candidate.location = text,
                        "office" => candidate.office = text,
                        "sect" => candidate.section = text,
                        "landno" => candidate.land_no = text,
                        _ => {}
                    }
                }
            }
            Ok(Event::End(event)) => {
                let tag = String::from_utf8_lossy(event.name().as_ref()).to_string();
                if tag == "addressItem" {
                    if let Some(candidate) = current.take() {
                        candidates.push(candidate);
                    }
                }
                current_tag.clear();
            }
            Ok(Event::Eof) => break,
            Err(error) => {
                return Err(LandRegistryError::Internal {
                    message: format!("CAD_009 XML parse failed: {error}"),
                });
            }
            _ => {}
        }
    }

    Ok(candidates)
}

pub fn parse_cadas_land_info_json(
    county: &str,
    section: &str,
    land_no: &str,
    body: &str,
) -> Result<NlscLandBuildingInfo, LandRegistryError> {
    let json: serde_json::Value = serde_json::from_str(body).map_err(|error| {
        LandRegistryError::Internal {
            message: format!("CAD_011 JSON parse failed: {error}"),
        }
    })?;
    let build_list = json
        .get("buildList")
        .and_then(serde_json::Value::as_array)
        .map(|items| {
            items
                .iter()
                .filter_map(serde_json::Value::as_str)
                .map(ToString::to_string)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();
    let owner_type = json
        .get("ownerType")
        .cloned()
        .unwrap_or_else(|| serde_json::json!({}));

    Ok(NlscLandBuildingInfo {
        county: county.to_string(),
        section: section.to_string(),
        land_no: land_no.to_string(),
        build_list,
        owner_type,
        source: "nlsc_cad".to_string(),
        trusted_for_pdf: false,
    })
}

#[cfg(test)]
mod tests {
    use super::{parse_address_query_land_xml, parse_cadas_land_info_json, NlscCadastralClient};
    use crate::land_registry::errors::LandRegistryError;
    use wiremock::matchers::method;
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[test]
    fn parses_address_query_land_xml() {
        let result = parse_address_query_land_xml(
            r#"<addressItems><addressItem><content>臺中市南屯區黎明路二段497號</content><location>120.634421,24.153412</location><office>BC</office><sect>2013</sect><landno>03420000</landno></addressItem></addressItems>"#,
        )
        .unwrap();

        assert_eq!(result.len(), 1);
        assert_eq!(result[0].office, "BC");
        assert_eq!(result[0].section, "2013");
        assert_eq!(result[0].land_no, "03420000");
        assert_eq!(result[0].source, "nlsc_cad");
        assert!(!result[0].trusted_for_pdf);
    }

    #[test]
    fn parses_cadas_land_info_json() {
        let result = parse_cadas_land_info_json(
            "B",
            "1121",
            "00080000",
            r#"{"buildList":["02906000","02907000"],"ownerType":{"本國人":"99.25%"}}"#,
        )
        .unwrap();

        assert_eq!(result.build_list, vec!["02906000", "02907000"]);
        assert_eq!(result.owner_type["本國人"], "99.25%");
        assert_eq!(result.source, "nlsc_cad");
        assert!(!result.trusted_for_pdf);
    }

    #[tokio::test]
    async fn classifies_permission_denied() {
        let server = MockServer::start().await;
        Mock::given(method("GET"))
            .respond_with(ResponseTemplate::new(404).set_body_string("PERMISSION DENIED"))
            .mount(&server)
            .await;

        let client = NlscCadastralClient::new(server.uri());
        let error = client.address_query_land("台南市東區裕農路288巷17號", 10).await.unwrap_err();

        assert!(matches!(error, LandRegistryError::NlscPermissionDenied { .. }));
    }
}
