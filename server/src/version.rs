use substring::Substring;

pub fn get_version_string() -> String {
    format!(
        "{}-{}",
        env!("CARGO_PKG_VERSION"),
        env!("VERGEN_GIT_SHA").substring(0, 8)
    )
    .to_owned()
}
