// 主執行檔入口 — 在 Windows release build 隱藏 console window
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    aire_lib::run();
}
