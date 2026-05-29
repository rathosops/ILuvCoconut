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
const STRONG_PROXIMITY_OVERLAP_RATIO: f32 = 0.62;

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

        if component.area >= min_area {
            components.push(component);
        }
    }

    merge_nearby_components(
        components,
        COMPONENT_MERGE_PADDING_MIN.max((width.min(height) as f32 * COMPONENT_MERGE_PADDING_RATIO).round() as u32),
    )
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

    if is_accessory_component(left, right) || is_accessory_component(right, left) {
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

fn is_accessory_component(candidate: &Component, anchor: &Component) -> bool {
    (candidate.area as f32) <= (anchor.area as f32 * ACCESSORY_AREA_RATIO)
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

    fn component(min_x: u32, min_y: u32, max_x: u32, max_y: u32) -> Component {
        Component {
            min_x,
            min_y,
            max_x,
            max_y,
            area: (max_x - min_x + 1) * (max_y - min_y + 1),
        }
    }
}
