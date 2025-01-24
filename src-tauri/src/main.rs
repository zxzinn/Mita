// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Emitter;
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
struct ImageFile {
    path: String,
    name: String,
}

struct WatcherState(Mutex<Option<RecommendedWatcher>>);

#[derive(Debug, Deserialize)]
struct WatchPayload {
    path: String,
}

#[tauri::command]
async fn get_images(path: String) -> Result<Vec<ImageFile>, String> {
    let images = WalkDir::new(&path)
        .into_iter()
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            let path = entry.path().to_string_lossy().to_lowercase();
            path.ends_with(".jpg") || path.ends_with(".jpeg") || path.ends_with(".png")
        })
        .map(|entry| ImageFile {
            path: entry.path().to_string_lossy().to_string(),
            name: entry
                .path()
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
        })
        .collect();

    Ok(images)
}

#[tauri::command]
async fn watch_directory(
    path: String,
    window: tauri::Window,
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        match res {
            Ok(_) => {
                // 當檔案變化時，發送事件通知前端重新獲取圖片列表
                let _ = window.emit_to("main", "directory-changed", ());
            }
            Err(e) => println!("watch error: {:?}", e),
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(PathBuf::from(path).as_path(), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *state.0.lock().unwrap() = Some(watcher);
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .manage(WatcherState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![get_images, watch_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
