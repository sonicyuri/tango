use async_process::{self, Command, ExitStatus, Stdio};
use futures::AsyncWriteExt;
use log::error;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::{Read, Write};
use tempfile::NamedTempFile;

use crate::booru_config::{BooruConfig, ThumbnailFit};

pub enum UploadFileType {
    Unsupported,
    Image,
    Video,
    Flash,
}

pub struct UploadInfo {
    pub file_type: UploadFileType,
    pub mime: String,
    pub length: Option<i32>,
    pub width: u32,
    pub height: u32,
    pub filesize: u64,
    pub hash: String,
}

impl UploadInfo {
    pub fn is_video(&self) -> bool {
        self.mime.starts_with("video")
    }

    pub fn is_image(&self) -> bool {
        self.mime.starts_with("image")
    }

    pub fn get_ext(&self) -> String {
        match self.mime.as_str() {
            "video/mp4" => "mp4",
            "video/webm" => "webm",
            "image/png" => "png",
            "image/webp" => "webp",
            "image/jpeg" => "jpeg",
            "image/gif" => "gif",
            "application/x-shockwave-flash" => "swf",
            _ => "unk",
        }
        .to_owned()
    }
}

#[derive(Serialize, Deserialize)]
struct FfprobeFormatInfo {
    format_name: String,
    format_long_name: String,
    duration: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct FfprobeStreamInfo {
    width: u32,
    height: u32,
    codec_type: String,
    codec_name: String,
}

#[derive(Serialize, Deserialize)]
struct FfprobeResult {
    format: FfprobeFormatInfo,
    streams: Vec<FfprobeStreamInfo>,
}

fn hash_file(file: &NamedTempFile) -> Result<String, String> {
    let mut handle = file.reopen().map_err(|e| {
        error!("Error getting temp file handle: {:?}", e);
        "Temp file error".to_owned()
    })?;

    let mut bytes: Vec<u8> = Vec::new();

    handle.read_to_end(&mut bytes).map_err(|e| {
        error!("Error reading file to hash: {:?}", e);
        "Temp file error".to_owned()
    })?;

    Ok(format!("{:x}", md5::compute(bytes)))
}

pub async fn get_content_info(content: &NamedTempFile) -> Result<UploadInfo, String> {
    let hash = hash_file(content)?;

    let filesize = content
        .as_file()
        .metadata()
        .map_err(|e| {
            error!("Error getting temp file metadata: {:?}", e);
            "Temp file error".to_owned()
        })?
        .len();

    let child = Command::new("ffprobe")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .args([
            content.path().to_str().ok_or("Temp file error")?,
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
        ])
        .spawn()
        .map_err(|e| {
            error!("error launching ffprobe: {:?}", e);
            "Can't get file information"
        })?;

    let output = child.output().await.map_err(|e| {
        error!("Failed to run ffprobe: {:?}", e);
        "Can't get file information"
    })?;
    let info_str = std::str::from_utf8(&output.stdout).map_err(|e| {
        error!("Failed to parse ffprobe response: {:?}", e);
        "Can't get file information"
    })?;
    let info: FfprobeResult = serde_json::from_str(info_str).map_err(|e| {
        error!("Failed to deserialize ffprobe response: {:?}", e);
        "Can't get file information"
    })?;
    let (file_type, mime) = match info.format.format_long_name.as_str() {
        "SWF (ShockWave Flash)" => Ok((UploadFileType::Flash, "application/x-shockwave-flash")),
        "QuickTime / MOV" => Ok((UploadFileType::Video, "video/mp4")),
        "Matroska / WebM" => Ok((UploadFileType::Video, "video/webm")),
        "image2 sequence" => Ok((UploadFileType::Image, "image/jpeg")),
        "piped jpeg sequence" => Ok((UploadFileType::Image, "image/jpeg")),
        "piped png sequence" => Ok((UploadFileType::Image, "image/png")),
        "CompuServe Graphics Interchange Format (GIF)" => Ok((UploadFileType::Image, "image/gif")),
        "piped webp sequence" => Ok((UploadFileType::Image, "image/webp")),
        _ => Err(format!(
            "Unknown file format type {}, {}",
            info.format.format_long_name, info.format.format_name
        )),
    }?;

    let length = info
        .format
        .duration
        .unwrap_or("0".to_owned())
        .parse::<f64>()
        .map_err(|e| "Invalid content duration")? as i32;

    let width = info
        .streams
        .first()
        .and(Some(info.streams.first().unwrap().width))
        .unwrap_or(0);
    let height = info
        .streams
        .first()
        .and(Some(info.streams.first().unwrap().height))
        .unwrap_or(0);

    Ok(UploadInfo {
        file_type,
        mime: mime.to_owned(),
        length: Some(length),
        width,
        height,
        filesize,
        hash,
    })
}

fn get_thumbnail_size(config: &BooruConfig, size: (u32, u32)) -> (u32, u32) {
    match config.thumb_fit {
        ThumbnailFit::Fit => {
            let (mut width, mut height) = size;

            if width < 1 {
                width = config.thumb_width;
            }

            if height < 1 {
                height = config.thumb_height;
            }

            if width > height * 5 {
                width = height * 5;
            } else if height > width * 5 {
                height = width * 5;
            }

            let x_scale = config.thumb_width as f32 / width as f32;
            let y_scale = config.thumb_height as f32 / height as f32;

            let scale = f32::max(y_scale, x_scale);
            (
                (width as f32 * scale) as u32,
                (height as f32 * scale) as u32,
            )
        }
        _ => (config.thumb_width, config.thumb_height),
    }
}

pub async fn create_thumbnail(
    config: &BooruConfig,
    content: &NamedTempFile,
    info: &UploadInfo,
) -> Result<NamedTempFile, String> {
    let (width, height) = get_thumbnail_size(config, (info.width, info.height));

    let scale_str = format!("scale={}:{},thumbnail", width, height);
    let out_temp = NamedTempFile::new().map_err(|e| {
        error!("Error creating thumbnail temp file: {:?}", e);
        "Can't create thumbnail"
    })?;

    let child = Command::new("ffmpeg")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .args([
            "-i",
            content.path().to_str().ok_or("Temp file error")?,
            "-y",
            "-vf",
            scale_str.as_str(),
            "-f",
            "image2",
            "-vframes",
            "1",
            "-qscale:v",
            "4",
            "-c:v",
            "mjpeg",
            out_temp.path().to_str().ok_or("Temp file error")?,
        ])
        .spawn()
        .map_err(|e| {
            error!("error launching ffmpeg: {:?}", e);
            "Can't create thumbnail"
        })?;

    let output = child.output().await.map_err(|e| {
        error!("Failed to run ffmpeg: {:?}", e);
        "Can't create thumbnail"
    })?;

    if !output.status.success() {
        error!(
            "FFMpeg failed, response: {}",
            std::str::from_utf8(&output.stdout).unwrap_or("")
        );
        return Err("Can't create thumbnail".to_owned());
    }

    Ok(out_temp)
}
