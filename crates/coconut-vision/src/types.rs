use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum BackgroundMode {
    Auto,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DetectionBackend {
    CoconutVision,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RgbaColor {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectSymbolsRequest {
    pub input_path: String,
    pub threshold: u8,
    pub min_area: u32,
    pub padding: u32,
    pub max_analysis_pixels: u32,
    pub background_mode: BackgroundMode,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CropSymbolsRequest {
    pub input_path: String,
    pub output_dir: String,
    pub name_prefix: String,
    pub threshold: u8,
    pub min_area: u32,
    pub padding: u32,
    pub max_analysis_pixels: u32,
    pub background_mode: BackgroundMode,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PixelDetectionRequest {
    pub width: u32,
    pub height: u32,
    pub source_width: u32,
    pub source_height: u32,
    pub rgba: Vec<u8>,
    pub threshold: u8,
    pub min_area: u32,
    pub padding: u32,
    pub background_mode: BackgroundMode,
    pub background_color: Option<RgbaColor>,
    pub analysis_scale: f32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectSymbolsResponse {
    pub symbols: Vec<DetectedSymbol>,
    pub summary: DetectionSummary,
    pub parameters: EffectiveDetectionParameters,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CropSymbolsResponse {
    pub detection: DetectSymbolsResponse,
    pub crops: Vec<CroppedSymbol>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CroppedSymbol {
    pub id: String,
    pub path: String,
    pub symbol: DetectedSymbol,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedSymbol {
    pub id: String,
    pub index: u32,
    pub row: u32,
    pub column: u32,
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
    pub source_area: u32,
    pub score: f32,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectionSummary {
    pub backend: DetectionBackend,
    pub figure_count: u32,
    pub row_count: u32,
    pub figures_by_row: Vec<u32>,
    pub analysis_scale: f32,
    pub elapsed_ms: u128,
    pub background_color: RgbaColor,
    pub algorithm_version: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EffectiveDetectionParameters {
    pub threshold: u8,
    pub min_area: u32,
    pub padding: u32,
    pub background_mode: BackgroundMode,
}

#[derive(Debug, Clone)]
pub(crate) struct Component {
    pub min_x: u32,
    pub min_y: u32,
    pub max_x: u32,
    pub max_y: u32,
    pub area: u32,
}
