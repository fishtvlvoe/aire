use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct Amenity {
    pub name: String,
    pub category: String,
    pub distance_m: f64,
    pub address: String,
}

fn haversine_distance_m(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let r = 6371000.0_f64;
    let dlat = (lat2 - lat1).to_radians();
    let dlon = (lon2 - lon1).to_radians();
    let a = (dlat / 2.0).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos() * (dlon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    r * c
}

#[tauri::command]
pub async fn query_nearby_amenities(lat: f64, lng: f64, radius_m: u32) -> Vec<Amenity> {
    let query = format!(
        r#"[out:json][timeout:30];
(
  nwr["amenity"="school"](around:{radius},{lat},{lng});
  nwr["amenity"="university"](around:{radius},{lat},{lng});
  nwr["amenity"="hospital"](around:{radius},{lat},{lng});
  nwr["leisure"="park"](around:{radius},{lat},{lng});
  nwr["railway"="station"](around:{radius},{lat},{lng});
  nwr["amenity"="marketplace"](around:{radius},{lat},{lng});
  nwr["shop"="supermarket"](around:{radius},{lat},{lng});
);
out center;"#,
        radius = radius_m,
        lat = lat,
        lng = lng
    );

    let client = match reqwest::Client::builder().timeout(std::time::Duration::from_secs(35)).build() {
        Ok(c) => c,
        Err(e) => {
            log::warn!("query_nearby_amenities error: {:?}", e);
            return Vec::new();
        }
    };

    let response = match client
        .get("https://overpass-api.de/api/interpreter")
        .query(&[("data", &query)])
        .send()
        .await
    {
        Ok(r) => r,
        Err(e) => {
            log::warn!("query_nearby_amenities error: {:?}", e);
            return Vec::new();
        }
    };

    let body: serde_json::Value = match response.json().await {
        Ok(v) => v,
        Err(e) => {
            log::warn!("query_nearby_amenities error: {:?}", e);
            return Vec::new();
        }
    };

    let elements = match body.get("elements") {
        Some(serde_json::Value::Array(arr)) => arr,
        _ => return Vec::new(),
    };

    let mut amenities = Vec::new();

    for elem in elements {
        let tags = match elem.get("tags") {
            Some(serde_json::Value::Object(t)) => t,
            _ => continue,
        };

        let category = if let Some(serde_json::Value::String(v)) = tags.get("amenity") {
            match v.as_str() {
                "school" | "university" => "學校",
                "hospital" => "醫院",
                "marketplace" => "市場",
                _ => continue,
            }
        } else if let Some(serde_json::Value::String(v)) = tags.get("leisure") {
            match v.as_str() {
                "park" => "公園",
                _ => continue,
            }
        } else if let Some(serde_json::Value::String(v)) = tags.get("railway") {
            match v.as_str() {
                "station" => "捷運/車站",
                _ => continue,
            }
        } else if let Some(serde_json::Value::String(v)) = tags.get("shop") {
            match v.as_str() {
                "supermarket" => "市場",
                _ => continue,
            }
        } else {
            continue;
        }
        .to_string();

        let name = tags
            .get("name:zh")
            .and_then(|v| v.as_str())
            .or_else(|| tags.get("name").and_then(|v| v.as_str()))
            .unwrap_or("未命名")
            .to_string();

        let (elat, elon) = if let Some(center) = elem.get("center") {
            (
                center.get("lat").and_then(|v| v.as_f64()).unwrap_or(lat),
                center.get("lon").and_then(|v| v.as_f64()).unwrap_or(lng),
            )
        } else {
            (
                elem.get("lat").and_then(|v| v.as_f64()).unwrap_or(lat),
                elem.get("lon").and_then(|v| v.as_f64()).unwrap_or(lng),
            )
        };

        let distance_m = haversine_distance_m(lat, lng, elat, elon);

        let address = tags
            .get("addr:full")
            .and_then(|v| v.as_str())
            .or_else(|| tags.get("addr:street").and_then(|v| v.as_str()))
            .unwrap_or("")
            .to_string();

        amenities.push(Amenity {
            name,
            category,
            distance_m,
            address,
        });
    }

    amenities.sort_by(|a, b| a.distance_m.partial_cmp(&b.distance_m).unwrap_or(std::cmp::Ordering::Equal));
    amenities
}
