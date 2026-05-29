const KERNEL_RADIUS: i32 = 1;

pub(crate) fn clean_mask(mask: &[u8], width: u32, height: u32) -> Vec<u8> {
    let dilated = dilate(mask, width, height);
    let eroded = erode(&dilated, width, height);
    dilate(&eroded, width, height)
}

fn erode(mask: &[u8], width: u32, height: u32) -> Vec<u8> {
    let mut output = vec![0_u8; mask.len()];

    for y in 0..height as i32 {
        for x in 0..width as i32 {
            let index = y as usize * width as usize + x as usize;
            output[index] = u8::from(has_full_neighborhood(mask, width, height, x, y));
        }
    }

    output
}

fn dilate(mask: &[u8], width: u32, height: u32) -> Vec<u8> {
    let mut output = vec![0_u8; mask.len()];

    for y in 0..height as i32 {
        for x in 0..width as i32 {
            let index = y as usize * width as usize + x as usize;
            output[index] = u8::from(has_any_neighborhood(mask, width, height, x, y));
        }
    }

    output
}

fn has_full_neighborhood(mask: &[u8], width: u32, height: u32, x: i32, y: i32) -> bool {
    for dy in -KERNEL_RADIUS..=KERNEL_RADIUS {
        for dx in -KERNEL_RADIUS..=KERNEL_RADIUS {
            let next_x = x + dx;
            let next_y = y + dy;
            if next_x < 0 || next_y < 0 || next_x >= width as i32 || next_y >= height as i32 {
                return false;
            }
            if mask[next_y as usize * width as usize + next_x as usize] == 0 {
                return false;
            }
        }
    }

    true
}

fn has_any_neighborhood(mask: &[u8], width: u32, height: u32, x: i32, y: i32) -> bool {
    for dy in -KERNEL_RADIUS..=KERNEL_RADIUS {
        for dx in -KERNEL_RADIUS..=KERNEL_RADIUS {
            let next_x = x + dx;
            let next_y = y + dy;
            if next_x < 0 || next_y < 0 || next_x >= width as i32 || next_y >= height as i32 {
                continue;
            }
            if mask[next_y as usize * width as usize + next_x as usize] != 0 {
                return true;
            }
        }
    }

    false
}
