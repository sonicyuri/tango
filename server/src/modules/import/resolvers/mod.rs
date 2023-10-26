use self::{
    fluffle::resolver::FluffleImportResolver, resolver::ImportResolver,
    resolver::ImportResolverInfo,
};

mod fluffle;
pub mod resolver;
mod util;

pub fn get_resolvers() -> Vec<ImportResolverInfo> {
    let mut vec: Vec<ImportResolverInfo> = Vec::new();
    vec.push(FluffleImportResolver::get_info());

    vec
}

pub fn get_resolver(id: String) -> Option<impl ImportResolver> {
    if id == "fluffle" {
        return Some(FluffleImportResolver {});
    }

    None
}
