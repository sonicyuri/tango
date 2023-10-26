# tango-server

A drop-in REST API client for an existing Shimmie database. Written in Rust.

## Requirements
- MySQL database
- Amazon S3 bucket or a bucket on an S3-compatible host
- Rust & cargo

## Setup

Currently, tango-server expects an already existing installation of Shimmie. While it can work on a fresh database with Shimmie's schema already in place, it can't yet create tables itself. 

For configuration, a `Config.toml` file needs to be created. In addition, sensitive configuration values need to be specified in the environment. The values required in each are described below.

Once the proper configuration is in place, `cargo run` will run a local testing copy, and `cargo build --release` will produce a production binary.

### Config.toml

Create a `Config.toml` file with the following structure
```
port = 3033
s3_endpoint = "https://s3.your-provider.com"
s3_bucket = "bucket-name"
s3_region = "us-east-1"
```

#### Values

##### port
The port that tango-server will listen on.

##### s3_endpoint

An Amazon S3 endpoint or the endpoint of an S3-compatible host.

##### s3_bucket

The bucket used to store post content and thumbnails.

###### s3_region

The S3 region that the bucket is in.

### Environment

For development, environment values can be specified in a `.env` file at the root of the project. For production, values should be specified directly through the environment.

#### Values

##### DATABASE_URL

A MySQL connection string in the form `mysql://<username>:<password>@<host>:<port>/<database>`.

##### TOKEN_SECRET

A random secret value used to encrypt and decrypt JWT tokens.

##### AWS_ACCESS_KEY_ID

The access key for Amazon S3 or an S3-compatible host.

##### AWS_SECRET_ACCESS_KEY

The secret key for Amazon S3 or an S3-compatible host.