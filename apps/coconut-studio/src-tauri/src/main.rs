#[tauri::command]
fn studio_version() -> &'static str {
    "0.1.0"
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![studio_version])
        .run(tauri::generate_context!())
        .expect("failed to run ILuvCoconut Studio");
}
