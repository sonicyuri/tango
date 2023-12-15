use actix_web::web::Query;

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
        let mut query_vec: Vec<String> = Vec::new();
        query_vec.push(query.to_owned());
        QueryObject {
            query: query_vec,
            parameters: Vec::new(),
        }
    }

    pub fn new_with_param(query: &str, param: impl ToString) -> QueryObject {
        let mut query_vec: Vec<String> = Vec::new();
        query_vec.push(query.to_owned());
        let mut param_vec: Vec<String> = Vec::new();
        param_vec.push(param.to_string());
        QueryObject {
            query: query_vec,
            parameters: param_vec,
        }
    }

    pub fn push_query(&mut self, query: &str) {
        self.query.push(query.to_owned());
    }

    /// Similar to push_params, but also inserts the ? into the query
    pub fn insert_params<'a, T>(&mut self, param: T)
    where
        T: Iterator<Item = &'a str>,
    {
        param.for_each(|p| {
            self.query.push("?".to_owned());
            self.parameters.push(p.to_owned())
        });
    }

    pub fn push_params<'a, T>(&mut self, param: T)
    where
        T: Iterator<Item = &'a str>,
    {
        param.for_each(|p| self.parameters.push(p.to_owned()));
    }

    pub fn insert_param(&mut self, param: impl ToString) {
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
