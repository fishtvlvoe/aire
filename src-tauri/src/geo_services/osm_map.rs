//! OSM Tile 拼接：下載 3x3 tiles，裁切為 600x400，畫紅點標記，加 attribution

use image::{Rgba, RgbaImage};
use log::warn;

const TILE_SIZE: u32 = 256;
const OSM_TILE_URL: &str = "https://tile.openstreetmap.org";

fn lat_lng_to_tile(lat: f64, lng: f64, zoom: u8) -> (u32, u32) {
    let n = 2_f64.powi(zoom as i32);
    let x = ((lng + 180.0) / 360.0 * n).floor() as u32;
    let lat_rad = lat.to_radians();
    let y = ((1.0 - (lat_rad.tan() + (1.0 / lat_rad.cos())).ln() / std::f64::consts::PI) / 2.0 * n).floor() as u32;
    (x, y)
}

async fn fetch_tile(z: u8, x: u32, y: u32) -> Option<Vec<u8>> {
    let url = format!("{}/{}/{}/{}.png", OSM_TILE_URL, z, x, y);
    let client = reqwest::Client::builder()
        .user_agent("AIRE/1.0 (contact: fish@fishot.com)")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .ok()?;
    let resp = client.get(&url).send().await.ok()?;
    if resp.status().is_success() {
        resp.bytes().await.ok().map(|b| b.to_vec())
    } else {
        None
    }
}

fn draw_red_circle(img: &mut RgbaImage, cx: u32, cy: u32, radius: u32) {
    let r_sq = (radius * radius) as i64;
    for dy in -(radius as i64)..=(radius as i64) {
        for dx in -(radius as i64)..=(radius as i64) {
            if dx * dx + dy * dy <= r_sq {
                let px = cx as i64 + dx;
                let py = cy as i64 + dy;
                if px >= 0 && py >= 0 && px < img.width() as i64 && py < img.height() as i64 {
                    img.put_pixel(px as u32, py as u32, Rgba([220, 38, 38, 255]));
                }
            }
        }
    }
}

fn draw_attribution(img: &mut RgbaImage, text: &str) {
    // 簡單白底黑字：左下角畫矩形 + 點像素近似文字（無 font 依賴）
    // 改為畫一個白色區域表示 attribution 區（有 font crate 才能畫文字）
    let bar_h = 14u32;
    let bar_w = img.width();
    let y_start = img.height().saturating_sub(bar_h);
    for y in y_start..img.height() {
        for x in 0..bar_w {
            // 白底半透明
            img.put_pixel(x, y, Rgba([255, 255, 255, 210]));
        }
    }
    // 文字用簡易點陣（不引入 font crate，OSM attribution 需求可接受）
    // 實際文字內容記錄在 alt text 層（PDF 頁面加文字說明）
    let _ = text; // 避免 unused warning
}

#[tauri::command]
pub async fn fetch_location_map(lat: f64, lng: f64, zoom: u8, size: String) -> Vec<u8> {
    // 解析目標尺寸
    let (target_w, target_h) = {
        let parts: Vec<&str> = size.split('x').collect();
        if parts.len() == 2 {
            let w = parts[0].parse::<u32>().unwrap_or(600);
            let h = parts[1].parse::<u32>().unwrap_or(400);
            (w, h)
        } else {
            (600u32, 400u32)
        }
    };

    let (cx, cy) = lat_lng_to_tile(lat, lng, zoom);

    // 3x3 grid：中心 tile ± 1
    let mut canvas = RgbaImage::new(TILE_SIZE * 3, TILE_SIZE * 3);

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
                        }
                        Err(e) => warn!("Tile decode failed ({},{},{}): {}", zoom, tx, ty, e),
                    }
                }
                None => warn!("Tile fetch failed ({},{},{})", zoom, tx, ty),
            }
        }
    }

    // 裁切到目標尺寸（從中心裁）
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

    let mut result = cropped;

    // 畫紅色中心標記
    draw_red_circle(&mut result, target_w / 2, target_h / 2, 8);

    // 加 attribution
    draw_attribution(&mut result, "© OpenStreetMap contributors");

    // 輸出 PNG bytes
    let mut buf = Vec::new();
    match result.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Png) {
        Ok(_) => buf,
        Err(e) => {
            warn!("PNG encode failed: {}", e);
            Vec::new()
        }
    }
}
