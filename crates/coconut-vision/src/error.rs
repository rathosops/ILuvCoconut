use thiserror::Error;

pub type VisionResult<T> = Result<T, VisionError>;

#[derive(Debug, Error)]
pub enum VisionError {
    #[error("image dimensions must be greater than zero")]
    EmptyImage,
    #[error("rgba buffer length {actual} does not match expected length {expected}")]
    InvalidRgbaBuffer { expected: usize, actual: usize },
    #[error("unable to load image: {0}")]
    Image(#[from] image::ImageError),
    #[error("unable to write output file: {0}")]
    Io(#[from] std::io::Error),
}
