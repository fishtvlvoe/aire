//! NLSC 航拍圖抓取：下載 3x3 tiles，拼成 768x768，裁切為 600x400，輸出 PNG

use image::RgbaImage;
use log::warn;

const TILE_SIZE: u32 = 256;
const NLSC_TILE_URL: &str = "https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible";

fn lat_lng_to_tile(lat: f64, lng: f64, zoom: u8) -> (u32, u32) {
    let n = 2_f64.powi(zoom as i32);
    let x = ((lng + 180.0) / 360.0 * n).floor() as u32;
    let lat_rad = lat.to_radians();
    let y = ((1.0 - (lat_rad.tan() + (1.0 / lat_rad.cos())).ln() / std::f64::consts::PI) / 2.0 * n).floor() as u32;
    (x, y)
}

async fn fetch_tile(z: u8, x: u32, y: u32) -> Option<Vec<u8>> {
    let url = format!("{}/{}/{}/{}", NLSC_TILE_URL, z, y, x);
    let client = reqwest::Client::builder()
        .user_agent("AIRE/1.0 (contact: fish@fishot.com)")
        .timeout(std::time::Duration::from_secs(10))
        .danger_accept_invalid_certs(true)
        .build()
        .ok()?;
    let resp = client.get(&url).send().await.ok()?;
    if resp.status().is_success() {
        resp.bytes().await.ok().map(|b| b.to_vec())
    } else {
        None
    }
}

#[tauri::command]
pub async fn fetch_aerial_photo(lat: f64, lng: f64) -> Vec<u8> {
    let zoom: u8 = 18;
    let (cx, cy) = lat_lng_to_tile(lat, lng, zoom);

    let mut canvas = RgbaImage::new(TILE_SIZE * 3, TILE_SIZE * 3);
    let mut any_success = false;

    for dy in 0u32..3 {
        for dx in 0u32..3 {
            let tx = cx.saturating_add(dx).saturating_sub(1);
            let ty = cy.saturating_add(dy).saturating_sub(1);
            match fetch_tile(zoom, tx, ty).await {
                Some(bytes) => {
                    match image::load_from_memory(&bytes) {
                        Ok(tile_img) => {
                            let tile = tile_img.to_rgba8();
                            let ox = dx * TILE_SIZE;
                            let oy = dy * TILE_SIZE;
                            for (px, py, pixel) in tile.enumerate_pixels() {
                                let nx = ox + px;
                                let ny = oy + py;
                                if nx < canvas.width() && ny < canvas.height() {
                                    canvas.put_pixel(nx, ny, *pixel);
                                }
                            }
                            any_success = true;
                        }
                        Err(e) => warn!("Aerial tile decode failed ({},{},{}): {}", zoom, tx, ty, e),
                    }
                }
                None => warn!("Aerial tile fetch failed ({},{},{})", zoom, tx, ty),
            }
        }
    }

    if !any_success {
        return Vec::new();
    }

    let target_w = 600u32;
    let target_h = 400u32;
    let crop_x = (canvas.width().saturating_sub(target_w)) / 2;
    let crop_y = (canvas.height().saturating_sub(target_h)) / 2;
    let cropped = image::imageops::crop_imm(
        &canvas,
        crop_x,
        crop_y,
        target_w.min(canvas.width()),
        target_h.min(canvas.height()),
    )
    .to_image();

    let mut buf = Vec::new();
    match cropped.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Png) {
        Ok(_) => buf,
        Err(e) => {
            warn!("Aerial PNG encode failed: {}", e);
            Vec::new()
        }
    }
}
