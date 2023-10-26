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

    pub fn push_query(&mut self, query: &str) {
        self.query.push(query.to_owned());
    }
    /*
    /// Similar to push_params, but also inserts the ? into the query
    pub fn insert_params<'a, T>(&mut self, param: &T)
    where
        T: Iterator<Item = &'a str>,
    {
        param.for_each(|p| self.query.push("?".to_owned()));
        self.push_params(param);
    }

    pub fn push_params<'a, T>(&mut self, param: &T)
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
    }*/
}
