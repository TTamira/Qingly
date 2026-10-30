use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/* 导出备份：弹系统「另存为」对话框，把前端传来的 JSON 内容写入所选路径。
   返回 Ok(Some(路径)) = 已保存；Ok(None) = 用户取消；Err = 失败原因。
   async 标记：命令在异步运行时线程执行，阻塞等对话框不会卡住主线程/窗口。 */
#[tauri::command(async)]
fn export_backup(
  app: tauri::AppHandle,
  content: String,
  default_name: String,
  default_dir: String,
) -> Result<Option<String>, String> {
  let mut builder = app.dialog().file().set_file_name(&default_name);
  if !default_dir.is_empty() {
    builder = builder.set_directory(&default_dir);
  }
  match builder.add_filter("JSON 备份文件", &["json"]).blocking_save_file() {
    Some(fp) => {
      let path = fp.into_path().map_err(|e| format!("导出路径无效：{}", e))?;
      std::fs::write(&path, content.as_bytes()).map_err(|e| format!("写入文件失败：{}", e))?;
      Ok(Some(path.to_string_lossy().to_string()))
    }
    None => Ok(None),
  }
}

/* 切换 DevTools 窗口（Ctrl+Alt+I 调用）。
   Tauri 发布版默认移除 devtools，需要 Cargo.toml 里 tauri 的 `devtools` feature。
   WebviewWindow 上直接有 open_devtools / close_devtools / is_devtools_open（2.12 已核对源码）。 */
#[tauri::command]
fn toggle_devtools(app: tauri::AppHandle) -> Result<(), String> {
  let Some(window) = app.get_webview_window("main") else {
    return Err("找不到 main 窗口".into());
  };
  if window.is_devtools_open() {
    window.close_devtools();
  } else {
    window.open_devtools();
  }
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![export_backup, toggle_devtools])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
