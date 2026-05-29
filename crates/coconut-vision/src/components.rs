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
            if let Some(target) = next.iter_mut().find(|candidate| boxes_overlap(candidate, &component, padding)) {
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
