use std::io::Cursor;

use image::{
    codecs::png::PngEncoder, imageops::FilterType, load_from_memory, ImageEncoder, ImageError,
    ImageOutputFormat,
};

pub async fn get_image_resized(data: Vec<u8>, max_size: u32) -> Result<Vec<u8>, ImageError> {
    let image = load_from_memory(&data)?;
    if image.width() <= max_size && image.height() <= max_size {
        return Ok(data);
    }

    let (width, height) = match image.width() > image.height() {
        true => (
            ((max_size as f32 / (image.height() as f32)) * (image.width() as f32)) as u32,
            max_size,
        ),
        false => (
            max_size,
            ((max_size as f32 / (image.width() as f32)) * (image.height() as f32)) as u32,
        ),
    };

    let image = image.resize_exact(width, height, FilterType::Gaussian);
    let mut bytes: Vec<u8> = Vec::new();
    image.write_to(&mut Cursor::new(&mut bytes), ImageOutputFormat::Png)?;
    Ok(bytes)
}
