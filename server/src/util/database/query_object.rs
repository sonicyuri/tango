use sqlx::{database::HasArguments, mysql::MySqlArguments, query::QueryAs, Database, FromRow, Row};

use super::types::{DbPtrType, DbType};

pub struct RangeSpecifier {
    limit: Option<i32>,
    offset: Option<i32>,
}

impl From<RangeSpecifier> for QueryObject {
    fn from(value: RangeSpecifier) -> Self {
        match value.limit {
            Some(limit) => match value.offset {
                Some(offset) => QueryObject::new_with_query(
                    format!("LIMIT {} OFFSET {}", limit, offset).as_str(),
                ),
                None => QueryObject::new_with_query(format!("LIMIT {}", limit).as_str()),
            },
            None => QueryObject::new(),
        }
    }
}

impl From<Option<RangeSpecifier>> for QueryObject {
    fn from(value: Option<RangeSpecifier>) -> Self {
        match value {
            Some(range) => range.into(),
            None => QueryObject::new(),
        }
    }
}

pub struct QueryObject {
    pub query: Vec<String>,
    pub parameters: Vec<String>,
}

impl QueryObject {
    pub fn new() -> QueryObject {
        QueryObject {
            query: Vec::new(),
            parameters: Vec::new(),
        }
    }

    pub fn new_with_query(query: &str) -> QueryObject {
        QueryObject {
            query: vec![query.to_owned()],
            parameters: Vec::new(),
        }
    }

    pub fn new_with_param(query: &str, param: impl ToString) -> QueryObject {
        QueryObject {
            query: vec![query.to_owned()],
            parameters: vec![param.to_string()],
        }
    }

    pub async fn query_all<T>(&self, db: DbPtrType) -> Result<Vec<T>, sqlx::Error>
    where
        for<'r> T: FromRow<'r, <DbType as Database>::Row> + std::marker::Send + std::marker::Unpin,
    {
        let s = self.to_string();
        let mut query_obj = sqlx::query_as::<DbType, T>(s.as_str());

        for p in &self.parameters {
            query_obj = query_obj.bind(p);
        }
        query_obj.fetch_all(db.as_ref()).await
    }

    pub fn push_query(&mut self, query: &str) {
        self.query.push(query.to_owned());
    }

    /// Similar to push_params, but also inserts the ? into the query
    pub fn insert_params<'a, T>(&mut self, param: T)
    where
        T: Iterator<Item = &'a str>,
    {
        for p in param {
            self.query.push("?".to_owned());
            self.parameters.push(p.to_owned());
        }
    }

    pub fn push_params<'a, T>(&mut self, param: T)
    where
        T: Iterator<Item = &'a str>,
    {
        for p in param {
            self.parameters.push(p.to_owned());
        }
    }

    pub fn insert_param(&mut self, param: impl ToString) {
        self.query.push("?".to_owned());
        self.parameters.push(param.to_string());
    }

    pub fn push_param(&mut self, param: impl ToString) {
        self.parameters.push(param.to_string());
    }

    pub fn append(&mut self, other: &QueryObject) {
        for p in &other.parameters {
            self.parameters.push(p.clone());
        }

        for q in &other.query {
            self.query.push(q.clone());
        }
    }
}

impl ToString for QueryObject {
    fn to_string(&self) -> String {
        self.query.join(" ")
    }
}

pub enum QueryConditionSetOperator {
    And,
    Or,
}

pub struct QueryConditionSet {
    conditions: Vec<QueryObject>,
    operator: QueryConditionSetOperator,
}

impl QueryConditionSet {
    pub fn new(
        operator: QueryConditionSetOperator,
        conditions: Vec<QueryObject>,
    ) -> QueryConditionSet {
        QueryConditionSet {
            conditions,
            operator,
        }
    }

    pub fn to_where_query(&self) -> QueryObject {
        if self.conditions.is_empty() {
            return QueryObject::new();
        }

        let mut query = QueryObject::new_with_query("WHERE");
        let count = self.conditions.len();
        for (idx, cond) in self.conditions.iter().enumerate() {
            query.append(cond);
            if idx < count - 1 {
                query.push_query(match self.operator {
                    QueryConditionSetOperator::And => "AND",
                    QueryConditionSetOperator::Or => "OR",
                });
            }
        }

        query
    }
}
