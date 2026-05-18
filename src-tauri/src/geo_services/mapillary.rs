//! Mapillary 街景圖抓取：查詢附近圖片，下載 thumb_2048_url 回傳 bytes

use log::warn;
use serde::Deserialize;

const MAPILLARY_TOKEN: &str = "MLY|26711795428473246|122d4e497640c1a4996b75b213564bb0";
const MAPILLARY_API_URL: &str = "https://graph.mapillary.com/images";

#[derive(Debug, Deserialize)]
struct Geometry {
    #[serde(rename = "type")]
    _type: String,
    coordinates: Vec<f64>,
}

#[derive(Debug, Deserialize)]
struct ImageItem {
    id: String,
    thumb_2048_url: String,
    geometry: Geometry,
}

#[derive(Debug, Deserialize)]
struct ImagesResponse {
    data: Vec<ImageItem>,
}

async fn fetch_image_list(lat: f64, lng: f64) -> Option<Vec<u8>> {
    let delta = 0.0005;
    let min_lat = lat - delta;
    let max_lat = lat + delta;
    let min_lng = lng - delta;
    let max_lng = lng + delta;

    let url = format!(
        "{}?fields=id,thumb_2048_url,geometry&bbox={},{},{},{}&access_token={}&limit=5",
        MAPILLARY_API_URL, min_lng, min_lat, max_lng, max_lat, MAPILLARY_TOKEN
    );

    let client = reqwest::Client::builder()
        .user_agent("AIRE/1.0 (contact: fish@fishot.com)")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .ok()?;

    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() {
        warn!("Mapillary API returned status: {}", resp.status());
        return None;
    }

    let body = resp.bytes().await.ok()?;
    Some(body.to_vec())
}

async fn download_image(url: &str) -> Option<Vec<u8>> {
    let client = reqwest::Client::builder()
        .user_agent("AIRE/1.0 (contact: fish@fishot.com)")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .ok()?;

    let resp = client.get(url).send().await.ok()?;
    if !resp.status().is_success() {
        warn!("Mapillary image download returned status: {}", resp.status());
        return None;
    }

    resp.bytes().await.ok().map(|b| b.to_vec())
}

#[tauri::command]
pub async fn fetch_street_view(lat: f64, lng: f64) -> Vec<u8> {
    let list_bytes = match fetch_image_list(lat, lng).await {
        Some(b) => b,
        None => {
            warn!("Failed to fetch Mapillary image list");
            return Vec::new();
        }
    };

    let parsed: ImagesResponse = match serde_json::from_slice(&list_bytes) {
        Ok(r) => r,
        Err(e) => {
            warn!("Failed to parse Mapillary JSON: {}", e);
            return Vec::new();
        }
    };

    if parsed.data.is_empty() {
        warn!("Mapillary API returned no images for lat={}, lng={}", lat, lng);
        return Vec::new();
    }

    let image_url = &parsed.data[0].thumb_2048_url;
    match download_image(image_url).await {
        Some(bytes) => bytes,
        None => {
            warn!("Failed to download Mapillary image from URL: {}", image_url);
            Vec::new()
        }
    }
}
