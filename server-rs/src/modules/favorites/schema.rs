use serde::{
    de::{self, Visitor},
    Deserialize, Serialize,
};

#[derive(Debug)]
pub enum FavoriteAction {
    Set,
    Unset,
}

impl Serialize for FavoriteAction {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        match self {
            FavoriteAction::Set => serializer.serialize_str("set"),
            FavoriteAction::Unset => serializer.serialize_str("unset"),
        }
    }
}

struct FavoriteActionVisitor;

impl<'a> Visitor<'a> for FavoriteActionVisitor {
    type Value = FavoriteAction;

    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        formatter.write_str("a value of 'set' or 'unset'")
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        match v {
            "set" => Ok(FavoriteAction::Set),
            "unset" => Ok(FavoriteAction::Unset),
            _ => Err(E::custom(format!("Unknown value {}", v))),
        }
    }

    fn visit_string<E>(self, v: String) -> Result<Self::Value, E>
    where
        E: de::Error,
    {
        self.visit_str(v.as_str())
    }
}

impl<'de> Deserialize<'de> for FavoriteAction {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserializer.deserialize_str(FavoriteActionVisitor)
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[allow(non_snake_case)]
pub struct FavoriteSetSchema {
    pub post_id: String,
    pub action: FavoriteAction,
}
