use std::sync::Arc;

use anyhow::Result;
use apalis::{prelude::*, sqlite::SqliteStorage, utils::TokioExecutor};
use job::{UploadJob, UploadJobContents, UploadJobResult, UploadJobResultContents};
use keyv::Keyv;
use serde::{Deserialize, Serialize};
use sqlx::{MySqlPool, SqlitePool};
use tokio::sync::Mutex;

use crate::{storage::DataManager, util::snowflake_id};

mod api;
mod file;
mod import;
mod job;

pub struct JobBundle {
    id: u64,
    jobs: Vec<UploadJob>,
}

impl JobBundle {
    pub fn new(jobs: Vec<UploadJob>) -> JobBundle {
        JobBundle {
            id: snowflake_id().unwrap(),
            jobs,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobStatus {
    id: u64,
    state: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JobBundleStatus {
    id: u64,
    jobs: Vec<JobStatus>,
}

#[derive(Clone)]
pub struct SupervisorContext {
    data: DataManager,
    db: Arc<Mutex<MySqlPool>>,
    cache: Arc<Mutex<Keyv>>,
}

pub type JobContext = Arc<SupervisorContext>;

pub struct UploadJobSupervisor(Arc<SupervisorContext>);

impl UploadJobSupervisor {
    pub fn new(data: DataManager, db: Arc<Mutex<MySqlPool>>) -> UploadJobSupervisor {
        UploadJobSupervisor(Arc::new(SupervisorContext {
            data: data,
            db: db.clone(),
            cache: Arc::new(Mutex::new(Keyv::default())),
        }))
    }

    pub async fn submit(&self, bundle: JobBundle) -> Result<JobBundleStatus> {
        todo!()
    }

    pub async fn start(&self) -> Result<SqliteStorage<UploadJob>> {
        let sqlite = SqlitePool::connect("sqlite://data/jobs.db").await?;
        let storage = SqliteStorage::new(sqlite);

        let monitor = Monitor::<TokioExecutor>::new().register_with_count(4, {
            let storage = storage.clone();
            let context = self.0.clone();
            WorkerBuilder::new(&format!("upload-job"))
                .data(context)
                .with_storage(storage.clone())
                .build_fn(Self::job_loop)
        });

        Ok(storage)
    }

    async fn job_loop(
        job: UploadJob,
        data: Data<JobContext>,
    ) -> std::result::Result<UploadJobResult, std::io::Error> {
        match job.contents {
            UploadJobContents::Query { .. } => todo!(),
            UploadJobContents::Import { .. } => todo!(),
            UploadJobContents::StartFile { .. } => todo!(),
            UploadJobContents::FileChunk { .. } => todo!(),
            UploadJobContents::ProcessFile { .. } => todo!(),
            UploadJobContents::UploadFile { .. } => todo!(),
            UploadJobContents::SubmitPosts { .. } => todo!(),
        }
    }
}
