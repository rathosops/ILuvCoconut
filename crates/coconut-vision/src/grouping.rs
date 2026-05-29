use crate::types::{Component, DetectedSymbol};

const ROW_CLUSTER_RATIO: f32 = 0.42;

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
    let row_tolerance = ((median_height as f32) * ROW_CLUSTER_RATIO).round().max(1.0);
    let mut rows: Vec<Vec<usize>> = Vec::new();
    let mut order: Vec<usize> = (0..frames.len()).collect();
    order.sort_by(|left, right| {
        center_y(&frames[*left])
            .total_cmp(&center_y(&frames[*right]))
            .then_with(|| frames[*left].x.cmp(&frames[*right].x))
    });

    for frame_index in order {
        let matching_row = rows.iter().position(|row| {
            row.first()
                .map(|candidate| (center_y(&frames[*candidate]) - center_y(&frames[frame_index])).abs() <= row_tolerance)
                .unwrap_or(false)
        });

        match matching_row {
            Some(row_index) => rows[row_index].push(frame_index),
            None => rows.push(vec![frame_index]),
        }
    }

    for (row_index, row) in rows.iter_mut().enumerate() {
        row.sort_by_key(|frame_index| frames[*frame_index].x);
        for (column_index, frame_index) in row.iter().enumerate() {
            frames[*frame_index].row = row_index as u32;
            frames[*frame_index].column = column_index as u32;
        }
    }

    frames.sort_by_key(|frame| (frame.row, frame.column));
}

fn center_y(frame: &Frame) -> f32 {
    frame.y as f32 + frame.height as f32 / 2.0
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
