use std::fs;
use std::path::Path;
use std::time::Instant;

use image::{imageops::FilterType, GenericImageView};

use crate::components::connected_components;
use crate::error::{VisionError, VisionResult};
use crate::grouping::components_to_symbols;
use crate::mask::{create_foreground_mask, sample_background};
use crate::morphology::clean_mask;
use crate::types::{
    CropSymbolsRequest, CropSymbolsResponse, CroppedSymbol, DetectedSymbol, DetectionBackend,
    DetectionSummary, DetectSymbolsRequest, DetectSymbolsResponse, EffectiveDetectionParameters,
    PixelDetectionRequest,
};

const ALGORITHM_VERSION: &str = "coconut-vision-0.1.0";
const RGBA_STRIDE: usize = 4;

pub fn detect_symbols(request: &DetectSymbolsRequest) -> VisionResult<DetectSymbolsResponse> {
    let image = image::open(&request.input_path)?;
    let (source_width, source_height) = image.dimensions();
    if source_width == 0 || source_height == 0 {
        return Err(VisionError::EmptyImage);
    }

    let analysis_scale = analysis_scale(source_width, source_height, request.max_analysis_pixels);
    let analysis_width = scaled_dimension(source_width, analysis_scale);
    let analysis_height = scaled_dimension(source_height, analysis_scale);
    let rgba = image
        .resize_exact(analysis_width, analysis_height, FilterType::Triangle)
        .to_rgba8()
        .into_raw();

    detect_pixels(
        analysis_width,
        analysis_height,
        &rgba,
        request.threshold,
        request.min_area,
        request.padding,
        request.background_mode,
        analysis_scale,
    )
}

pub fn crop_symbols(request: &CropSymbolsRequest) -> VisionResult<CropSymbolsResponse> {
    let detection = detect_symbols(&DetectSymbolsRequest {
        input_path: request.input_path.clone(),
        threshold: request.threshold,
        min_area: request.min_area,
        padding: request.padding,
        max_analysis_pixels: request.max_analysis_pixels,
        background_mode: request.background_mode,
    })?;
    fs::create_dir_all(&request.output_dir)?;
    let source = image::open(&request.input_path)?.to_rgba8();
    let mut crops = Vec::with_capacity(detection.symbols.len());

    for symbol in &detection.symbols {
        let id = format!("{}-{:02}-{:02}", sanitize_asset_id(&request.name_prefix), symbol.row + 1, symbol.column + 1);
        let output_path = Path::new(&request.output_dir).join(format!("{id}.png"));
        let crop = image::imageops::crop_imm(&source, symbol.x, symbol.y, symbol.width, symbol.height).to_image();
        crop.save(&output_path)?;
        crops.push(CroppedSymbol {
            id,
            path: output_path.to_string_lossy().into_owned(),
            symbol: symbol.clone(),
        });
    }

    Ok(CropSymbolsResponse { detection, crops })
}

pub fn detect_symbols_from_rgba(request: &PixelDetectionRequest) -> VisionResult<DetectSymbolsResponse> {
    detect_pixels(
        request.width,
        request.height,
        &request.rgba,
        request.threshold,
        request.min_area,
        request.padding,
        request.background_mode,
        request.analysis_scale,
    )
}

fn detect_pixels(
    width: u32,
    height: u32,
    rgba: &[u8],
    threshold: u8,
    min_area: u32,
    padding: u32,
    background_mode: crate::types::BackgroundMode,
    analysis_scale: f32,
) -> VisionResult<DetectSymbolsResponse> {
    let started_at = Instant::now();
    validate_rgba(width, height, rgba)?;

    let background_color = sample_background(width, height, rgba);
    let mask = create_foreground_mask(width, height, rgba, background_color, threshold);
    let mask = clean_mask(&mask, width, height);
    let scaled_min_area = ((min_area as f32) * analysis_scale * analysis_scale).round().max(1.0) as u32;
    let components = connected_components(&mask, width, height, scaled_min_area);
    let symbols = components_to_symbols(&components, width, height, padding, analysis_scale);
    let figures_by_row = figures_by_row(&symbols);

    Ok(DetectSymbolsResponse {
        summary: DetectionSummary {
            backend: DetectionBackend::CoconutVision,
            figure_count: symbols.len() as u32,
            row_count: figures_by_row.len() as u32,
            figures_by_row,
            analysis_scale,
            elapsed_ms: started_at.elapsed().as_millis(),
            background_color,
            algorithm_version: ALGORITHM_VERSION.to_string(),
        },
        parameters: EffectiveDetectionParameters {
            threshold,
            min_area,
            padding,
            background_mode,
        },
        symbols,
    })
}

fn validate_rgba(width: u32, height: u32, rgba: &[u8]) -> VisionResult<()> {
    if width == 0 || height == 0 {
        return Err(VisionError::EmptyImage);
    }

    let expected = width as usize * height as usize * RGBA_STRIDE;
    if rgba.len() != expected {
        return Err(VisionError::InvalidRgbaBuffer {
            expected,
            actual: rgba.len(),
        });
    }

    Ok(())
}

fn analysis_scale(width: u32, height: u32, max_analysis_pixels: u32) -> f32 {
    let source_pixels = width as f32 * height as f32;
    let max_pixels = max_analysis_pixels.max(1) as f32;
    (max_pixels / source_pixels).sqrt().min(1.0)
}

fn scaled_dimension(value: u32, scale: f32) -> u32 {
    ((value as f32) * scale).round().max(1.0) as u32
}

fn figures_by_row(symbols: &[DetectedSymbol]) -> Vec<u32> {
    let max_row = symbols.iter().map(|symbol| symbol.row).max();
    match max_row {
        Some(row) => (0..=row)
            .map(|row_index| symbols.iter().filter(|symbol| symbol.row == row_index).count() as u32)
            .collect(),
        None => Vec::new(),
    }
}

fn sanitize_asset_id(value: &str) -> String {
    let mut output = String::new();
    let mut previous_dash = false;

    for character in value.chars().flat_map(char::to_lowercase) {
        if character.is_ascii_alphanumeric() {
            output.push(character);
            previous_dash = false;
        } else if !previous_dash && !output.is_empty() {
            output.push('-');
            previous_dash = true;
        }
    }

    output.trim_matches('-').to_string()
}

#[cfg(test)]
mod tests {
    use crate::types::BackgroundMode;

    use super::*;

    #[test]
    fn detects_variable_rows() {
        let width = 170;
        let height = 70;
        let mut rgba = vec![0_u8; width * height * RGBA_STRIDE];
        fill(&mut rgba, width, 22, 10, 10, 10, [255, 0, 0, 255]);
        fill(&mut rgba, width, 62, 10, 10, 10, [255, 0, 0, 255]);
        fill(&mut rgba, width, 22, 38, 10, 10, [255, 0, 0, 255]);
        fill(&mut rgba, width, 62, 38, 10, 10, [255, 0, 0, 255]);
        fill(&mut rgba, width, 102, 38, 10, 10, [255, 0, 0, 255]);

        let response = detect_symbols_from_rgba(&PixelDetectionRequest {
            width: width as u32,
            height: height as u32,
            rgba,
            threshold: 20,
            min_area: 20,
            padding: 0,
            background_mode: BackgroundMode::Auto,
            analysis_scale: 1.0,
        })
        .expect("synthetic image should be detected");

        assert_eq!(response.summary.figure_count, 5);
        assert_eq!(response.summary.figures_by_row, vec![2, 3]);
    }

    #[test]
    fn sanitizes_asset_id() {
        assert_eq!(sanitize_asset_id("Fruit Classic! Symbol"), "fruit-classic-symbol");
    }

    fn fill(rgba: &mut [u8], width: usize, x: usize, y: usize, rect_width: usize, rect_height: usize, color: [u8; 4]) {
        for row in y..(y + rect_height) {
            for column in x..(x + rect_width) {
                let index = (row * width + column) * RGBA_STRIDE;
                rgba[index..index + RGBA_STRIDE].copy_from_slice(&color);
            }
        }
    }
}
