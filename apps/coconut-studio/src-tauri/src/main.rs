use coconut_vision::{detect_symbols_from_rgba, PixelDetectionRequest};

#[tauri::command]
fn studio_version() -> &'static str {
    "0.1.0"
}

#[tauri::command]
fn detect_symbols(request: PixelDetectionRequest) -> Result<coconut_vision::DetectSymbolsResponse, String> {
    detect_symbols_from_rgba(&request).map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![studio_version, detect_symbols])
        .run(tauri::generate_context!())
        .expect("failed to run ILuvCoconut Studio");
}
