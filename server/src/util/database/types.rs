use std::rc::Rc;

pub type DbPoolType = sqlx::MySqlPool;
pub type DbPtrType = Rc<DbPoolType>;
pub type IdType = i32;
pub type DbType = sqlx::MySql;
