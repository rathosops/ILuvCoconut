use crate::types::{Component, DetectedSymbol};

const ROW_CLUSTER_RATIO: f32 = 0.42;
const ROW_CLUSTER_MIN_RATIO: f32 = 0.7;
const FRAME_OVERLAP_MIN_SIZE: u32 = 4;

pub(crate) fn components_to_symbols(
    components: &[Component],
    width: u32,
    height: u32,
    padding: u32,
    analysis_scale: f32,
) -> Vec<DetectedSymbol> {
    let mut frames: Vec<Frame> = components
        .iter()
        .map(|component| component_to_frame(component, width, height, padding, analysis_scale))
        .collect();
    assign_rows_and_columns(&mut frames);
    frames
        .into_iter()
        .enumerate()
        .map(|(index, frame)| DetectedSymbol {
            id: format!("symbol-{}", index + 1),
            index: index as u32,
            row: frame.row,
            column: frame.column,
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
            source_area: frame.source_area,
            score: 1.0,
        })
        .collect()
}

#[derive(Debug, Clone)]
struct Frame {
    row: u32,
    column: u32,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
    source_area: u32,
}

fn component_to_frame(component: &Component, image_width: u32, image_height: u32, padding: u32, analysis_scale: f32) -> Frame {
    let inverse_scale = 1.0 / analysis_scale.max(f32::EPSILON);
    let x = scale_floor(component.min_x.saturating_sub(padding), inverse_scale);
    let y = scale_floor(component.min_y.saturating_sub(padding), inverse_scale);
    let max_x = image_width.min(scale_ceil(component.max_x + padding, inverse_scale));
    let max_y = image_height.min(scale_ceil(component.max_y + padding, inverse_scale));

    Frame {
        row: 0,
        column: 0,
        x,
        y,
        width: max_x.saturating_sub(x).max(1),
        height: max_y.saturating_sub(y).max(1),
        source_area: component.area,
    }
}

fn assign_rows_and_columns(frames: &mut [Frame]) {
    let median_height = median(frames.iter().map(|frame| frame.height).collect());
    let min_height = frames.iter().map(|frame| frame.height).min().unwrap_or(1);
    let row_tolerance = ((median_height as f32) * ROW_CLUSTER_RATIO)
        .round()
        .max(((min_height as f32) * ROW_CLUSTER_MIN_RATIO).round())
        .max(1.0);
    let mut rows: Vec<Vec<usize>> = Vec::new();
    let mut order: Vec<usize> = (0..frames.len()).collect();
    order.sort_by(|left, right| {
        center_y(&frames[*left])
            .total_cmp(&center_y(&frames[*right]))
            .then_with(|| frames[*left].x.cmp(&frames[*right].x))
    });

    for frame_index in order {
        let matching_row = rows.iter().position(|row| {
            !row.is_empty() && (median_center_y(row, frames) - center_y(&frames[frame_index])).abs() <= row_tolerance
        });

        match matching_row {
            Some(row_index) => rows[row_index].push(frame_index),
            None => rows.push(vec![frame_index]),
        }
    }

    for (row_index, row) in rows.iter_mut().enumerate() {
        row.sort_by_key(|frame_index| frames[*frame_index].x);
        trim_row_overlaps(row, frames);
        for (column_index, frame_index) in row.iter().enumerate() {
            frames[*frame_index].row = row_index as u32;
            frames[*frame_index].column = column_index as u32;
        }
    }

    frames.sort_by_key(|frame| (frame.row, frame.column));
}

fn trim_row_overlaps(row: &[usize], frames: &mut [Frame]) {
    for pair in row.windows(2) {
        let left_index = pair[0];
        let right_index = pair[1];
        let left_end = frames[left_index].x + frames[left_index].width;
        let right_start = frames[right_index].x;
        if left_end <= right_start {
            continue;
        }

        let right_end = frames[right_index].x + frames[right_index].width;
        let boundary = ((left_end + right_start) as f32 / 2.0).round() as u32;
        let clamped_boundary = boundary
            .max(frames[left_index].x + FRAME_OVERLAP_MIN_SIZE)
            .min(right_end.saturating_sub(FRAME_OVERLAP_MIN_SIZE));

        frames[left_index].width = clamped_boundary.saturating_sub(frames[left_index].x).max(FRAME_OVERLAP_MIN_SIZE);
        frames[right_index].x = clamped_boundary;
        frames[right_index].width = right_end.saturating_sub(clamped_boundary).max(FRAME_OVERLAP_MIN_SIZE);
    }
}

fn center_y(frame: &Frame) -> f32 {
    frame.y as f32 + frame.height as f32 / 2.0
}

fn median_center_y(row: &[usize], frames: &[Frame]) -> f32 {
    let mut values: Vec<f32> = row.iter().map(|frame_index| center_y(&frames[*frame_index])).collect();
    values.sort_by(f32::total_cmp);
    values[values.len() / 2]
}

fn median(mut values: Vec<u32>) -> u32 {
    if values.is_empty() {
        return 1;
    }
    values.sort_unstable();
    values[values.len() / 2]
}

fn scale_floor(value: u32, inverse_scale: f32) -> u32 {
    ((value as f32) * inverse_scale).floor().max(0.0) as u32
}

fn scale_ceil(value: u32, inverse_scale: f32) -> u32 {
    ((value as f32) * inverse_scale).ceil().max(1.0) as u32
}
