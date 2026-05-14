use serde::Serialize;
use std::cell::RefCell;

#[derive(Debug, Clone, Serialize)]
pub struct ThemeConfig {
    pub theme_id: String,
}

#[derive(Debug, Clone)]
pub enum ThemeError {
    EmptyThemeId,
}

impl std::fmt::Display for ThemeError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ThemeError::EmptyThemeId => write!(f, "theme_id cannot be empty"),
        }
    }
}

impl std::error::Error for ThemeError {}

thread_local! {
    static THEME_ID: RefCell<Option<String>> = const { RefCell::new(None) };
}

pub fn set_theme(theme_id: &str) -> Result<(), ThemeError> {
    let t = theme_id.trim();
    if t.is_empty() {
        return Err(ThemeError::EmptyThemeId);
    }
    THEME_ID.with(|cell| {
        *cell.borrow_mut() = Some(t.to_string());
    });
    Ok(())
}

pub fn get_current_theme() -> Result<ThemeConfig, ThemeError> {
    let theme_id = THEME_ID.with(|cell| cell.borrow().clone());
    Ok(ThemeConfig {
        theme_id: theme_id.unwrap_or_else(|| "theme-a-minimal".into()),
    })
}
