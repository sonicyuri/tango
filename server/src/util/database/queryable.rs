use std::{marker::PhantomData, rc::Rc};

use once_cell::sync::OnceCell;
use sea_query::{Cond, Expr};
use sqlx::Database;

use super::{
    query_object::{QueryConditionSet, QueryConditionSetOperator, QueryObject, RangeSpecifier},
    types::{DbPtrType, IdType},
};

pub trait Queryable {
    async fn find_one(db: DbPtrType, id: IdType) -> Result<Self, sqlx::Error>
    where
        Self: std::marker::Sized;

    async fn find_many(
        db: DbPtrType,
        filter: QueryConditionSet,
        range: Option<RangeSpecifier>,
    ) -> Result<Vec<Self>, sqlx::Error>
    where
        Self: std::marker::Sized;
}

pub struct DbRef<T: Queryable> {
    ref_id: i32,
    contents: Option<Rc<T>>,
}

impl<T: Queryable> From<i32> for DbRef<T> {
    fn from(value: i32) -> Self {
        DbRef {
            ref_id: value,
            contents: None,
        }
    }
}

impl<T: Queryable> DbRef<T> {
    pub async fn get(&mut self, db: DbPtrType) -> Result<Rc<T>, sqlx::Error> {
        if let Some(obj) = &self.contents {
            return Ok(obj.clone());
        }

        let ptr: Rc<T> = <T>::find_one(db, self.ref_id).await?.into();
        self.contents = Some(ptr.clone());
        return Ok(ptr);
    }
}
