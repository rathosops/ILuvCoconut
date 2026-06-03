use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use coconut_vision::{detect_symbols_from_rgba, PixelDetectionRequest};
use serde::{Deserialize, Serialize};
use serde_json::json;

const DEFAULT_SLOT_REELS: u64 = 5;
const DEFAULT_SLOT_ROWS: u64 = 3;
const MILLIS_PER_SECOND: u128 = 1000;

#[tauri::command]
fn studio_version() -> &'static str {
    "0.1.0"
}

#[tauri::command]
fn detect_symbols(
    request: PixelDetectionRequest,
) -> Result<coconut_vision::DetectSymbolsResponse, String> {
    detect_symbols_from_rgba(&request).map_err(|error| error.to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectSummary {
    id: String,
    name: String,
    #[serde(rename = "type")]
    kind: String,
    grid_label: String,
    renderer: String,
    updated_at: u128,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateProjectRequest {
    id: String,
    name: String,
    #[serde(rename = "type")]
    kind: String,
    renderer: String,
    language: String,
    resolution: String,
    template: String,
}

/// Walks up from the working directory to find the repository's `games/` folder.
fn games_dir() -> Result<PathBuf, String> {
    let mut dir = std::env::current_dir().map_err(|error| error.to_string())?;
    loop {
        let candidate = dir.join("games");
        if candidate.is_dir() {
            return Ok(candidate);
        }
        if !dir.pop() {
            return Err("Diretório games/ não encontrado.".to_string());
        }
    }
}

fn modified_millis(path: &Path) -> u128 {
    fs::metadata(path)
        .and_then(|meta| meta.modified())
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|delta| delta.as_millis())
        .unwrap_or(0)
}

fn read_summary(dir: &Path) -> Option<ProjectSummary> {
    let config_path = dir.join("game.config.json");
    let raw = fs::read_to_string(&config_path).ok()?;
    let config: serde_json::Value = serde_json::from_str(&raw).ok()?;
    let id = config.get("gameId").or_else(|| config.get("id")).and_then(|value| value.as_str())
        .map(str::to_string)
        .or_else(|| dir.file_name().map(|name| name.to_string_lossy().to_string()))?;
    let kind = config.get("type").and_then(|value| value.as_str()).unwrap_or("slot").to_string();
    let name = config.get("title").and_then(|value| value.as_str()).unwrap_or(&id).to_string();
    let layout = config.get("layout").or_else(|| config.get("slot"));
    let reels = layout.and_then(|value| value.get("reels")).and_then(serde_json::Value::as_u64);
    let rows = layout.and_then(|value| value.get("rows")).and_then(serde_json::Value::as_u64);
    let grid_label = match (kind.as_str(), reels, rows) {
        ("slot", Some(columns), Some(lines)) => format!("{columns}×{lines}"),
        ("slot", _, _) => format!("{DEFAULT_SLOT_REELS}×{DEFAULT_SLOT_ROWS}"),
        _ => "—".to_string(),
    };
    Some(ProjectSummary {
        id,
        name,
        kind,
        grid_label,
        renderer: "pixi".to_string(),
        updated_at: modified_millis(&config_path),
    })
}

#[tauri::command]
fn list_projects() -> Result<Vec<ProjectSummary>, String> {
    let root = games_dir()?;
    let mut summaries = Vec::new();
    for entry in fs::read_dir(&root).map_err(|error| error.to_string())? {
        let path = entry.map_err(|error| error.to_string())?.path();
        if path.is_dir() {
            if let Some(summary) = read_summary(&path) {
                summaries.push(summary);
            }
        }
    }
    summaries.sort_by_key(|summary| std::cmp::Reverse(summary.updated_at));
    Ok(summaries)
}

#[tauri::command]
fn create_project(request: CreateProjectRequest) -> Result<(), String> {
    let root = games_dir()?;
    let project = root.join(&request.id);
    for sub in ["assets/raw/symbols", "assets/raw/backgrounds", "assets/raw/ui", "assets/raw/audio", "assets/optimized", "fixtures"] {
        fs::create_dir_all(project.join(sub)).map_err(|error| error.to_string())?;
    }
    let now = SystemTime::now().duration_since(UNIX_EPOCH).map(|delta| delta.as_millis()).unwrap_or(0) / MILLIS_PER_SECOND;
    let config = json!({
        "schemaVersion": 1,
        "gameId": request.id,
        "title": request.name,
        "type": request.kind,
        "template": request.template,
        "renderer": request.renderer,
        "language": request.language,
        "resolution": request.resolution,
        "createdAt": now,
        "slot": { "reels": DEFAULT_SLOT_REELS, "rows": DEFAULT_SLOT_ROWS },
        "symbols": []
    });
    let pretty = serde_json::to_string_pretty(&config).map_err(|error| error.to_string())?;
    fs::write(project.join("game.config.json"), pretty).map_err(|error| error.to_string())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_project(id: &str, config: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("ilc-test-{}-{id}", std::process::id()));
        fs::create_dir_all(&dir).expect("create temp project dir");
        fs::write(dir.join("game.config.json"), config).expect("write config");
        dir
    }

    #[test]
    fn reads_slot_summary_with_grid_label() {
        let dir = temp_project(
            "slot",
            r#"{ "gameId": "fruit-classic", "title": "Fruit Classic", "type": "slot", "slot": { "reels": 5, "rows": 3 } }"#,
        );
        let summary = read_summary(&dir).expect("summary");
        assert_eq!(summary.id, "fruit-classic");
        assert_eq!(summary.name, "Fruit Classic");
        assert_eq!(summary.kind, "slot");
        assert_eq!(summary.grid_label, "5×3");
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn non_slot_summary_has_dash_grid_label() {
        let dir = temp_project("bingo", r#"{ "gameId": "lucky-bingo", "type": "bingo" }"#);
        let summary = read_summary(&dir).expect("summary");
        assert_eq!(summary.grid_label, "—");
        assert_eq!(summary.renderer, "pixi");
        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn missing_config_yields_no_summary() {
        let dir = std::env::temp_dir().join(format!("ilc-test-empty-{}", std::process::id()));
        fs::create_dir_all(&dir).expect("create dir");
        assert!(read_summary(&dir).is_none());
        fs::remove_dir_all(&dir).ok();
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![studio_version, detect_symbols, list_projects, create_project])
        .run(tauri::generate_context!())
        .expect("failed to run ILuvCoconut Studio");
}
