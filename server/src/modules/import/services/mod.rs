use self::{e926::service::E926ImportService, service::ImportService};

mod e926;
pub mod service;

pub fn get_service(url: String) -> Option<impl ImportService> {
    if E926ImportService::test(url) {
        return Some(E926ImportService {});
    }

    None
}
