use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql, Pool};

use super::model::UserModel;
use crate::util::database::query_object::{QueryConditionSet, QueryObject, RangeSpecifier};
use crate::util::database::queryable::Queryable;
use crate::util::database::types::{DbPtrType, IdType};

pub struct User {
    pub id: i32,
    pub name: String,
    pub pass: Option<String>,
    pub join_date: DateTime<Utc>,
    pub class: String,
    pub email: Option<String>,
}

impl From<UserModel> for User {
    fn from(value: UserModel) -> Self {
        User {
            id: value.id,
            name: value.name,
            pass: value.pass,
            join_date: value.joindate,
            class: value.class,
            email: value.email,
        }
    }
}

impl Queryable for User {
    async fn find_one(db: DbPtrType, id: IdType) -> Result<Self, sqlx::Error> {
        let user = sqlx::query_as!(UserModel, "SELECT * FROM users WHERE id = ?", id)
            .fetch_one(db.as_ref())
            .await?;

        return Ok(user.into());
    }

    async fn find_many(
        db: DbPtrType,
        filter: QueryConditionSet,
        range: Option<RangeSpecifier>,
    ) -> Result<Vec<Self>, sqlx::Error> {
        let mut query = QueryObject::new_with_query("SELECT * FROM users");
        query.append(&filter.to_where_query());
        query.append(&range.into());

        Ok(query
            .query_all::<UserModel>(db)
            .await?
            .iter()
            .map(|u| u.clone().into())
            .collect())
    }
}
