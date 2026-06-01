use crate::types::Component;

const NEIGHBORS: [(i32, i32); 8] = [
    (-1, 0),
    (1, 0),
    (0, -1),
    (0, 1),
    (-1, -1),
    (1, -1),
    (-1, 1),
    (1, 1),
];
const COMPONENT_MERGE_PADDING_MIN: u32 = 8;
const COMPONENT_MERGE_PADDING_RATIO: f32 = 0.018;
const ACCESSORY_AREA_RATIO: f32 = 0.45;
const ACCESSORY_SPAN_RATIO: f32 = 0.58;
const STRONG_PROXIMITY_OVERLAP_RATIO: f32 = 0.62;
const MIN_COMPONENT_AREA_BEFORE_MERGE: u32 = 12;
const SPLIT_WIDTH_RATIO: f32 = 1.55;
const SPLIT_ASPECT_RATIO: f32 = 1.2;
const SPLIT_SEARCH_MARGIN_RATIO: f32 = 0.3;
const SPLIT_VALLEY_RATIO: f32 = 0.38;
const SPLIT_MIN_AREA_RATIO: f32 = 0.35;

pub(crate) fn connected_components(mask: &[u8], width: u32, height: u32, min_area: u32) -> Vec<Component> {
    let mut visited = vec![false; mask.len()];
    let mut queue = vec![0_usize; mask.len()];
    let mut components = Vec::new();

    for start in 0..mask.len() {
        if visited[start] || mask[start] == 0 {
            continue;
        }

        let mut head = 0;
        let mut tail = 0;
        queue[tail] = start;
        tail += 1;
        visited[start] = true;

        let start_x = (start % width as usize) as u32;
        let start_y = (start / width as usize) as u32;
        let mut component = Component {
            min_x: start_x,
            min_y: start_y,
            max_x: start_x,
            max_y: start_y,
            area: 0,
        };

        while head < tail {
            let pixel = queue[head];
            head += 1;
            let x = (pixel % width as usize) as u32;
            let y = (pixel / width as usize) as u32;
            component.area += 1;
            component.min_x = component.min_x.min(x);
            component.min_y = component.min_y.min(y);
            component.max_x = component.max_x.max(x);
            component.max_y = component.max_y.max(y);

            for (dx, dy) in NEIGHBORS {
                let next_x = x as i32 + dx;
                let next_y = y as i32 + dy;
                if next_x < 0 || next_y < 0 || next_x >= width as i32 || next_y >= height as i32 {
                    continue;
                }

                let next_pixel = next_y as usize * width as usize + next_x as usize;
                if visited[next_pixel] || mask[next_pixel] == 0 {
                    continue;
                }

                visited[next_pixel] = true;
                queue[tail] = next_pixel;
                tail += 1;
            }
        }

        if component.area >= MIN_COMPONENT_AREA_BEFORE_MERGE {
            components.push(component);
        }
    }

    let merged = merge_nearby_components(
        components,
        COMPONENT_MERGE_PADDING_MIN.max((width.min(height) as f32 * COMPONENT_MERGE_PADDING_RATIO).round() as u32),
    );
    let split = split_wide_components(mask, width, &merged, min_area);

    split
    .into_iter()
    .filter(|component| component.area >= min_area)
    .collect()
}

fn merge_nearby_components(components: Vec<Component>, padding: u32) -> Vec<Component> {
    let mut merged = components;
    let mut changed = true;

    while changed {
        changed = false;
        let mut next: Vec<Component> = Vec::new();

        for component in merged {
            if let Some(target) = next.iter_mut().find(|candidate| should_merge_components(candidate, &component, padding)) {
                target.min_x = target.min_x.min(component.min_x);
                target.min_y = target.min_y.min(component.min_y);
                target.max_x = target.max_x.max(component.max_x);
                target.max_y = target.max_y.max(component.max_y);
                target.area += component.area;
                changed = true;
            } else {
                next.push(component);
            }
        }

        merged = next;
    }

    merged
}

fn boxes_overlap(left: &Component, right: &Component, padding: u32) -> bool {
    left.min_x.saturating_sub(padding) <= right.max_x
        && left.max_x + padding >= right.min_x
        && left.min_y.saturating_sub(padding) <= right.max_y
        && left.max_y + padding >= right.min_y
}

fn should_merge_components(left: &Component, right: &Component, padding: u32) -> bool {
    if !boxes_overlap(left, right, padding) {
        return false;
    }

    if is_accessory_component(left, right, padding) || is_accessory_component(right, left, padding) {
        return true;
    }

    let gap = axis_gap(left.min_x, left.max_x, right.min_x, right.max_x)
        .max(axis_gap(left.min_y, left.max_y, right.min_y, right.max_y));
    if gap > padding / 2 {
        return false;
    }

    horizontal_overlap_ratio(left, right) >= STRONG_PROXIMITY_OVERLAP_RATIO
        || vertical_overlap_ratio(left, right) >= STRONG_PROXIMITY_OVERLAP_RATIO
}

fn is_accessory_component(candidate: &Component, anchor: &Component, padding: u32) -> bool {
    if (candidate.area as f32) > (anchor.area as f32 * ACCESSORY_AREA_RATIO) {
        return false;
    }
    let gap = axis_gap(candidate.min_x, candidate.max_x, anchor.min_x, anchor.max_x)
        .max(axis_gap(candidate.min_y, candidate.max_y, anchor.min_y, anchor.max_y));
    if gap > padding {
        return false;
    }

    component_width(candidate) as f32 <= component_width(anchor) as f32 * ACCESSORY_SPAN_RATIO
        || component_height(candidate) as f32 <= component_height(anchor) as f32 * ACCESSORY_SPAN_RATIO
}

fn axis_gap(left_min: u32, left_max: u32, right_min: u32, right_max: u32) -> u32 {
    if left_max < right_min {
        right_min - left_max
    } else if right_max < left_min {
        left_min - right_max
    } else {
        0
    }
}

fn horizontal_overlap_ratio(left: &Component, right: &Component) -> f32 {
    overlap_ratio(left.min_x, left.max_x, right.min_x, right.max_x)
}

fn vertical_overlap_ratio(left: &Component, right: &Component) -> f32 {
    overlap_ratio(left.min_y, left.max_y, right.min_y, right.max_y)
}

fn component_width(component: &Component) -> u32 {
    component.max_x - component.min_x + 1
}

fn component_height(component: &Component) -> u32 {
    component.max_y - component.min_y + 1
}

fn overlap_ratio(left_min: u32, left_max: u32, right_min: u32, right_max: u32) -> f32 {
    let overlap_min = left_min.max(right_min);
    let overlap_max = left_max.min(right_max);
    if overlap_max < overlap_min {
        return 0.0;
    }

    let overlap = overlap_max - overlap_min + 1;
    let left_span = left_max - left_min + 1;
    let right_span = right_max - right_min + 1;
    overlap as f32 / left_span.min(right_span) as f32
}

fn split_wide_components(mask: &[u8], image_width: u32, components: &[Component], min_area: u32) -> Vec<Component> {
    let median_width = median(components.iter().map(component_width).collect());
    components
        .iter()
        .flat_map(|component| split_component(mask, image_width, component, median_width, min_area))
        .collect()
}

fn split_component(mask: &[u8], image_width: u32, component: &Component, median_width: u32, min_area: u32) -> Vec<Component> {
    if !should_try_split(component, median_width) {
        return vec![component.clone()];
    }

    let projection = vertical_projection(mask, image_width, component);
    let max_projection = projection.iter().copied().max().unwrap_or(0);
    let Some(split_offset) = find_split_offset(&projection, max_projection) else {
        return vec![component.clone()];
    };
    let split_x = component.min_x + split_offset;
    let left = bounds_from_mask(mask, image_width, component, component.min_x, split_x);
    let right = bounds_from_mask(mask, image_width, component, split_x + 1, component.max_x);
    let min_split_area = MIN_COMPONENT_AREA_BEFORE_MERGE.max(((min_area as f32) * SPLIT_MIN_AREA_RATIO).round() as u32);

    match (left, right) {
        (Some(left), Some(right)) if left.area >= min_split_area && right.area >= min_split_area => vec![left, right],
        _ => vec![component.clone()],
    }
}

fn should_try_split(component: &Component, median_width: u32) -> bool {
    let width = component_width(component) as f32;
    let height = component_height(component) as f32;
    width >= median_width as f32 * SPLIT_WIDTH_RATIO && width >= height * SPLIT_ASPECT_RATIO
}

fn vertical_projection(mask: &[u8], image_width: u32, component: &Component) -> Vec<u32> {
    let mut projection = vec![0_u32; component_width(component) as usize];

    for y in component.min_y..=component.max_y {
        for x in component.min_x..=component.max_x {
            if mask[y as usize * image_width as usize + x as usize] != 0 {
                projection[(x - component.min_x) as usize] += 1;
            }
        }
    }

    projection
}

fn find_split_offset(projection: &[u32], max_projection: u32) -> Option<u32> {
    if max_projection == 0 {
        return None;
    }
    let start = ((projection.len() as f32) * SPLIT_SEARCH_MARGIN_RATIO).floor() as usize;
    let end = ((projection.len() as f32) * (1.0 - SPLIT_SEARCH_MARGIN_RATIO)).ceil() as usize;
    let mut best_offset = start;
    let mut best_score = f32::INFINITY;

    for offset in start..=end.min(projection.len().saturating_sub(1)) {
        let score = smoothed_projection(projection, offset);
        if score < best_score {
            best_offset = offset;
            best_score = score;
        }
    }

    (best_score <= max_projection as f32 * SPLIT_VALLEY_RATIO).then_some(best_offset as u32)
}

fn smoothed_projection(projection: &[u32], offset: usize) -> f32 {
    let center = projection[offset];
    let left = projection.get(offset.saturating_sub(1)).copied().unwrap_or(center);
    let right = projection.get(offset + 1).copied().unwrap_or(center);
    (left + center + right) as f32 / 3.0
}

fn bounds_from_mask(mask: &[u8], image_width: u32, component: &Component, min_x: u32, max_x: u32) -> Option<Component> {
    let mut output = None;

    for y in component.min_y..=component.max_y {
        for x in min_x..=max_x {
            if mask[y as usize * image_width as usize + x as usize] == 0 {
                continue;
            }
            output = Some(expand_bounds(output, x, y));
        }
    }

    output
}

fn expand_bounds(bounds: Option<Component>, x: u32, y: u32) -> Component {
    match bounds {
        Some(mut bounds) => {
            bounds.min_x = bounds.min_x.min(x);
            bounds.min_y = bounds.min_y.min(y);
            bounds.max_x = bounds.max_x.max(x);
            bounds.max_y = bounds.max_y.max(y);
            bounds.area += 1;
            bounds
        }
        None => Component {
            min_x: x,
            min_y: y,
            max_x: x,
            max_y: y,
            area: 1,
        },
    }
}

fn median(mut values: Vec<u32>) -> u32 {
    if values.is_empty() {
        return 1;
    }
    values.sort_unstable();
    values[values.len() / 2]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn does_not_merge_nearby_large_symbols() {
        let components = vec![
            component(10, 10, 39, 39),
            component(47, 10, 76, 39),
        ];

        let merged = merge_nearby_components(components, 8);

        assert_eq!(merged.len(), 2);
    }

    #[test]
    fn merges_small_accessory_with_symbol() {
        let components = vec![
            component(10, 10, 39, 39),
            component(44, 12, 48, 18),
        ];

        let merged = merge_nearby_components(components, 8);

        assert_eq!(merged.len(), 1);
        assert_eq!(merged[0].max_x, 48);
    }

    #[test]
    fn does_not_merge_nearby_medium_symbols_by_area_only() {
        let components = vec![
            component(10, 10, 59, 59),
            component(65, 16, 99, 55),
        ];

        let merged = merge_nearby_components(components, 8);

        assert_eq!(merged.len(), 2);
    }

    #[test]
    fn splits_wide_component_at_projection_valley() {
        let width = 80;
        let height = 30;
        let mut mask = vec![0_u8; width * height];
        fill_mask(&mut mask, width, 5, 6, 25, 18);
        fill_mask(&mut mask, width, 45, 6, 25, 18);
        fill_mask(&mut mask, width, 38, 13, 3, 4);
        let components = vec![
            component(5, 6, 69, 23),
            component(5, 24, 24, 29),
            component(28, 24, 47, 29),
            component(50, 24, 69, 29),
        ];

        let split = split_wide_components(&mask, width as u32, &components, 50);

        assert_eq!(split.len(), 5);
        assert!(split[0].max_x < split[1].min_x);
    }

    fn component(min_x: u32, min_y: u32, max_x: u32, max_y: u32) -> Component {
        Component {
            min_x,
            min_y,
            max_x,
            max_y,
            area: (max_x - min_x + 1) * (max_y - min_y + 1),
        }
    }

    fn fill_mask(mask: &mut [u8], width: usize, x: usize, y: usize, rect_width: usize, rect_height: usize) {
        for row in y..(y + rect_height) {
            for column in x..(x + rect_width) {
                mask[row * width + column] = 1;
            }
        }
    }
}
