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

/* ---------- 每日自动备份（本地应用数据目录，不占 localStorage 配额） ---------- */

/* 解析 YYYY-MM-DD，返回距 1970-01-01 的天数；格式不对返回 None */
fn parse_day(s: &str) -> Option<i64> {
  let b = s.as_bytes();
  if b.len() != 10 || b[4] != b'-' || b[7] != b'-' {
    return None;
  }
  let num = |r: std::ops::Range<usize>| -> Option<i64> {
    let part = &s[r];
    if !part.bytes().all(|c| c.is_ascii_digit()) {
      return None;
    }
    part.parse::<i64>().ok()
  };
  let (y, m, d) = (num(0..4)?, num(5..7)?, num(8..10)?);
  if !(1..=12).contains(&m) || !(1..=31).contains(&d) {
    return None;
  }
  // Howard Hinnant 的 days_from_civil
  let y = if m <= 2 { y - 1 } else { y };
  let era = if y >= 0 { y } else { y - 399 } / 400;
  let yoe = y - era * 400;
  let mp = (m + 9) % 12;
  let doy = (153 * mp + 2) / 5 + d - 1;
  let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  Some(era * 146097 + doe - 719468)
}

/* 清理：保留含今天在内最近 7 天的快照；先按日期淘汰更早的，
   最后无论多旧都保留日期最新的那一份。返回 (已删除, 删除失败) 文件名 */
fn prune_backups(dir: &std::path::Path, today: &str) -> (Vec<String>, Vec<String>) {
  let cutoff = match parse_day(today) {
    Some(d) => d - 6,
    None => return (Vec::new(), Vec::new()),
  };
  let mut files: Vec<(i64, std::path::PathBuf, String)> = Vec::new();
  if let Ok(rd) = std::fs::read_dir(dir) {
    for entry in rd.flatten() {
      let name = entry.file_name().to_string_lossy().to_string();
      let stem = match name.strip_suffix(".json") {
        Some(s) => s,
        None => continue,
      };
      if let Some(day) = parse_day(stem) {
        files.push((day, entry.path(), name));
      }
    }
  }
  files.sort_by(|a, b| b.0.cmp(&a.0)); // 新 → 旧
  let mut removed = Vec::new();
  let mut failed = Vec::new();
  for (i, (day, path, name)) in files.iter().enumerate() {
    if i == 0 {
      continue; // 最新一份永远保留，即使超出 7 天
    }
    if *day < cutoff {
      match std::fs::remove_file(path) {
        Ok(_) => removed.push(name.clone()),
        Err(_) => failed.push(name.clone()),
      }
    }
  }
  (removed, failed)
}

/* 每天首次启动写一份当天快照：文件已存在则跳过；返回写入位置与清理结果 */
#[tauri::command(async)]
fn daily_backup(
  app: tauri::AppHandle,
  content: String,
  date: String,
) -> Result<serde_json::Value, String> {
  parse_day(&date).ok_or_else(|| format!("日期格式不对：{}", date))?;
  let base = app
    .path()
    .app_data_dir()
    .map_err(|e| format!("找不到应用数据目录：{}", e))?;
  let dir = base.join("backups");
  std::fs::create_dir_all(&dir).map_err(|e| format!("创建备份目录失败：{}", e))?;
  let file = dir.join(format!("{}.json", date));
  let skipped = file.exists();
  if !skipped {
    std::fs::write(&file, content.as_bytes()).map_err(|e| format!("写入备份失败：{}", e))?;
  }
  let (removed, failed) = prune_backups(&dir, &date);
  Ok(serde_json::json!({
    "file": file.to_string_lossy(),
    "skipped": skipped,
    "removed": removed,
    "failed": failed
  }))
}

const B64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/* 手写 base64（项目没有 base64 依赖，避免为选图加新 crate） */
fn b64_encode(data: &[u8]) -> String {
  let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
  for chunk in data.chunks(3) {
    let b0 = chunk[0] as u32;
    let b1 = *chunk.get(1).unwrap_or(&0) as u32;
    let b2 = *chunk.get(2).unwrap_or(&0) as u32;
    let n = (b0 << 16) | (b1 << 8) | b2;
    out.push(B64[((n >> 18) & 63) as usize] as char);
    out.push(B64[((n >> 12) & 63) as usize] as char);
    out.push(if chunk.len() > 1 { B64[((n >> 6) & 63) as usize] as char } else { '=' });
    out.push(if chunk.len() > 2 { B64[(n & 63) as usize] as char } else { '=' });
  }
  out
}

/* 本地选图：弹系统图片文件对话框，读取后以 data URL 返回，压缩由前端 Canvas 完成。
   返回 {canceled:true} = 取消；{tooLarge:true} = 原文件 >10MB；{dataUrl} = 成功。 */
#[tauri::command(async)]
fn pick_image_file(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
  match app
    .dialog()
    .file()
    .add_filter("图片", &["png", "jpg", "jpeg", "webp", "gif", "bmp"])
    .blocking_pick_file()
  {
    Some(fp) => {
      let path = fp.into_path().map_err(|e| format!("所选路径无效：{}", e))?;
      let size = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
      if size > 10 * 1024 * 1024 {
        return Ok(serde_json::json!({ "tooLarge": true }));
      }
      let bytes = std::fs::read(&path).map_err(|e| format!("读取图片失败：{}", e))?;
      let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_ascii_lowercase())
        .unwrap_or_default();
      let mime = match ext.as_str() {
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        _ => "image/jpeg",
      };
      Ok(serde_json::json!({
        "dataUrl": format!("data:{};base64,{}", mime, b64_encode(&bytes)),
        "name": path.file_name().and_then(|s| s.to_str()).unwrap_or(""),
        "size": size
      }))
    }
    None => Ok(serde_json::json!({ "canceled": true })),
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
    .invoke_handler(tauri::generate_handler![
      export_backup,
      daily_backup,
      pick_image_file,
      toggle_devtools
    ])
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}

#[cfg(test)]
mod backup_tests {
  use super::{parse_day, prune_backups};
  use std::fs;
  use std::path::PathBuf;

  fn sandbox(tag: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("qx_backup_{}_{}", tag, std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
  }

  fn touch(dir: &PathBuf, name: &str) {
    fs::write(dir.join(name), b"{}").unwrap();
  }

  fn names(dir: &PathBuf) -> Vec<String> {
    let mut v: Vec<String> = fs::read_dir(dir)
      .unwrap()
      .flatten()
      .map(|e| e.file_name().to_string_lossy().to_string())
      .collect();
    v.sort();
    v
  }

  #[test]
  fn keeps_seven_days_and_drops_eighth() {
    let dir = sandbox("window");
    for d in 1..=8 {
      touch(&dir, &format!("2026-01-0{}.json", d));
    }
    let (removed, failed) = prune_backups(&dir, "2026-01-08");
    assert!(failed.is_empty());
    assert_eq!(removed, vec!["2026-01-01.json"]); // 第 8 天被淘汰
    let left = names(&dir);
    assert_eq!(left.len(), 7);
    assert!(!left.contains(&"2026-01-01.json".to_string()));
    assert!(left.contains(&"2026-01-08.json".to_string()));
  }

  #[test]
  fn always_keeps_newest_even_if_stale() {
    let dir = sandbox("stale");
    touch(&dir, "2025-11-01.json");
    touch(&dir, "2025-11-05.json");
    touch(&dir, "2025-11-03.json");
    let (removed, _) = prune_backups(&dir, "2026-01-08");
    assert_eq!(removed, vec!["2025-11-03.json", "2025-11-01.json"]);
    assert_eq!(names(&dir), vec!["2025-11-05.json"]); // 最新一份超期也保留
  }

  #[test]
  fn ignores_foreign_files_and_bad_dates() {
    let dir = sandbox("mixed");
    touch(&dir, "2026-01-01.json");
    touch(&dir, "2026-01-02.json");
    touch(&dir, "notes.txt");
    touch(&dir, "2026-13-40.json");
    let (removed, _) = prune_backups(&dir, "2026-01-02");
    assert!(removed.is_empty()); // 7 天窗口内不删
    assert_eq!(names(&dir).len(), 4);
  }

  #[test]
  fn parses_dates() {
    assert_eq!(parse_day("1970-01-01"), Some(0));
    assert_eq!(parse_day("2026-01-08").unwrap() - parse_day("2026-01-01").unwrap(), 7);
    assert_eq!(parse_day("2026-1-8"), None);
    assert_eq!(parse_day("2026-13-08"), None);
    assert_eq!(parse_day("2026-02-31"), Some(parse_day("2026-03-03").unwrap())); // 溢出按天数进位，仅内部使用
  }
}
