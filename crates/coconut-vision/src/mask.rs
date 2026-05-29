use crate::types::RgbaColor;

const RGBA_STRIDE: usize = 4;
const ALPHA_OFFSET: usize = 3;
const MIN_ALPHA_FOR_FOREGROUND: u8 = 12;

pub(crate) fn sample_background(width: u32, height: u32, rgba: &[u8]) -> RgbaColor {
    let last_x = width.saturating_sub(1);
    let last_y = height.saturating_sub(1);
    let mid_x = width / 2;
    let mid_y = height / 2;
    let points = [
        (0, 0),
        (last_x, 0),
        (0, last_y),
        (last_x, last_y),
        (mid_x, 0),
        (0, mid_y),
        (last_x, mid_y),
        (mid_x, last_y),
    ];
    let samples = points.map(|(x, y)| pixel_at(width, rgba, x, y));

    RgbaColor {
        r: median(samples.map(|color| color.r)),
        g: median(samples.map(|color| color.g)),
        b: median(samples.map(|color| color.b)),
        a: median(samples.map(|color| color.a)),
    }
}

pub(crate) fn create_foreground_mask(width: u32, height: u32, rgba: &[u8], background: RgbaColor, threshold: u8) -> Vec<u8> {
    let mut mask = vec![0_u8; width as usize * height as usize];

    for pixel in 0..mask.len() {
        let offset = pixel * RGBA_STRIDE;
        let alpha = rgba[offset + ALPHA_OFFSET];
        let color = RgbaColor {
            r: rgba[offset],
            g: rgba[offset + 1],
            b: rgba[offset + 2],
            a: alpha,
        };
        mask[pixel] = u8::from(alpha > MIN_ALPHA_FOR_FOREGROUND && color_distance(color, background) > f32::from(threshold));
    }

    mask
}

fn pixel_at(width: u32, rgba: &[u8], x: u32, y: u32) -> RgbaColor {
    let offset = (y as usize * width as usize + x as usize) * RGBA_STRIDE;
    RgbaColor {
        r: rgba[offset],
        g: rgba[offset + 1],
        b: rgba[offset + 2],
        a: rgba[offset + 3],
    }
}

fn median<const N: usize>(mut values: [u8; N]) -> u8 {
    values.sort_unstable();
    values[N / 2]
}

fn color_distance(left: RgbaColor, right: RgbaColor) -> f32 {
    let red = f32::from(left.r) - f32::from(right.r);
    let green = f32::from(left.g) - f32::from(right.g);
    let blue = f32::from(left.b) - f32::from(right.b);
    (red * red + green * green + blue * blue).sqrt()
}
