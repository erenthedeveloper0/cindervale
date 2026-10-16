use std::collections::HashMap;
use std::fmt;

const MAX_HOURS: f32 = 40.0;

#[derive(Debug, Clone, PartialEq)]
pub enum Status {
    Draft,
    Active { since: u32 },
    Archived,
}

pub struct Ledger<'a> {
    entries: HashMap<&'a str, Vec<f32>>,
}

impl<'a> Ledger<'a> {
    pub fn total(&self, project: &str) -> Option<f32> {
        self.entries.get(project).map(|hours| hours.iter().sum())
    }

    pub fn is_over(&self, project: &str) -> bool {
        matches!(self.total(project), Some(total) if total > MAX_HOURS)
    }
}

impl fmt::Display for Status {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let label = match self {
            Status::Draft => "draft",
            Status::Active { .. } => "active",
            Status::Archived => "archived",
        };
        write!(f, "{label}")
    }
}

fn main() {
    let mut ledger = Ledger { entries: HashMap::new() };
    ledger.entries.insert("atelier", vec![6.5, 7.0, 8.25]);
    println!("over budget: {}", ledger.is_over("atelier"));
}
