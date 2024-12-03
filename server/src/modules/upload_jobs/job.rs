use std::sync::Arc;

use apalis::prelude::Job;
use serde::{Deserialize, Serialize};

use crate::{
    error::ApiError,
    modules::posts::{
        model::{PendingPost, PostModel},
        new::UploadInfo,
    },
    storage::TempFile,
};

#[derive(Serialize, Deserialize)]
pub enum UploadJobStatus {
    Ok,
    Error(ApiError),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportQueryResult {}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportOptions {}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UploadJobContents {
    /// We're gathering initial data on the item
    Query {
        url: String,
    },
    /// Information received from the user, we're trying to import and process the post now
    Import {
        result: ImportQueryResult,
        options: ImportOptions,
    },
    StartFile {
        len: usize,
    },
    FileChunk {
        data: Box<[u8]>,
        index: usize,
    },
    ProcessFile {
        file: TempFile,
    },
    UploadFile {
        file: TempFile,
        thumb_file: TempFile,
    },
    SubmitPosts {
        posts: Vec<PostModel>,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct UploadJob {
    pub contents: UploadJobContents,
    pub id: usize,
}

impl UploadJob {
    pub fn new(id: usize, contents: UploadJobContents) -> UploadJob {
        UploadJob { id, contents }
    }
}

impl Job for UploadJob {
    const NAME: &'static str = "upload_job";
}

#[derive(Debug)]
pub enum UploadJobResultContents {
    /// The initial query has completed, we need the user to confirm next steps
    QueryComplete {
        result: ImportQueryResult,
    },
    FileUploadInitiated {
        file: TempFile,
        chunks: Vec<(usize, usize, bool)>,
    },
    FileChunkUploaded {
        file: TempFile,
        remaining: Vec<(usize, usize, bool)>,
    },
    ReadyForProcessing {
        file: TempFile,
    },
    ProcessingCompleted {
        file: TempFile,
        thumb_file: TempFile,
        info: UploadInfo,
    },
    Complete {
        posts: Vec<PostModel>,
    },
}

pub struct UploadJobResult {
    result: UploadJobResultContents,
    id: usize,
}
