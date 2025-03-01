// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Emitter;
use tauri::Manager;
use walkdir::WalkDir;
use std::fs;

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

#[tauri::command]
async fn get_app_image_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    println!("開始獲取應用程序圖片目錄");
    
    // 使用Tauri 2.0的新API方式獲取應用程序數據目錄
    println!("嘗試獲取應用程序數據目錄");
    let app_data_dir_result = app_handle.path().app_data_dir();
    
    let app_data_dir = match app_data_dir_result {
        Ok(dir) => {
            println!("成功獲取應用程序數據目錄: {:?}", dir);
            dir
        },
        Err(e) => {
            let error_msg = format!("無法獲取應用程序數據目錄: {}", e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    };
    
    // 創建圖片目錄
    let image_dir = app_data_dir.join("images");
    
    println!("圖片目錄: {:?}", image_dir);
    
    // 如果目錄不存在，則創建它
    if !image_dir.exists() {
        println!("圖片目錄不存在，嘗試創建");
        match fs::create_dir_all(&image_dir) {
            Ok(_) => println!("成功創建圖片目錄"),
            Err(e) => {
                let error_msg = format!("無法創建圖片目錄: {}", e);
                println!("{}", error_msg);
                return Err(error_msg);
            }
        }
    } else {
        println!("圖片目錄已存在");
    }
    
    // 檢查目錄是否可寫
    println!("檢查圖片目錄是否可寫");
    let test_file = image_dir.join("test_write_permission.tmp");
    match fs::write(&test_file, b"test") {
        Ok(_) => {
            println!("圖片目錄可寫");
            // 刪除測試文件
            if let Err(e) = fs::remove_file(&test_file) {
                println!("警告：無法刪除測試文件: {}", e);
            }
        },
        Err(e) => {
            let error_msg = format!("圖片目錄不可寫: {}", e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    }
    
    // 返回圖片目錄的路徑
    let path_str = image_dir.to_string_lossy().to_string();
    println!("返回圖片目錄路徑: {}", path_str);
    Ok(path_str)
}

fn main() {
    println!("應用程序啟動");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .manage(WatcherState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![get_images, watch_directory, get_app_image_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
