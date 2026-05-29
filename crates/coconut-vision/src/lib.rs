mod components;
mod detection;
mod error;
mod grouping;
mod mask;
mod morphology;
mod types;

pub use detection::{crop_symbols, detect_symbols, detect_symbols_from_rgba};
pub use error::{VisionError, VisionResult};
pub use types::{
    BackgroundMode, CropSymbolsRequest, CropSymbolsResponse, CroppedSymbol, DetectedSymbol,
    DetectionBackend, DetectionSummary, DetectSymbolsRequest, DetectSymbolsResponse,
    EffectiveDetectionParameters, PixelDetectionRequest, RgbaColor,
};
