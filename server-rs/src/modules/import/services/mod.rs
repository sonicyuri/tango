use self::{e621::service::E621ImportService, service::ImportService};

mod e621;
pub mod service;
mod util;

pub fn get_service(url: String) -> Option<impl ImportService> {
    if E621ImportService::test(url) {
        return Some(E621ImportService {});
    }

    None
}
