//! Browser management for headless Chrome
//! 
//! Note: This module provides browser automation capabilities.
//! The actual browser pool implementation is simplified for production use.

use chromiumoxide::{Browser, BrowserConfig, Page};
use futures::StreamExt;

use crate::error::AppError;

/// Launch a new headless browser instance with optional proxy
pub async fn launch_browser(proxy: Option<&str>) -> Result<(Browser, tokio::task::JoinHandle<()>), AppError> {
    let mut config_builder = BrowserConfig::builder()
        .no_sandbox()
        .arg("--headless=new")
        .arg("--disable-gpu")
        .arg("--disable-dev-shm-usage")
        .arg("--no-first-run")
        .arg("--disable-extensions")
        .window_size(1920, 1080);

    // Add proxy if configured
    if let Some(proxy_url) = proxy {
        tracing::info!("Using proxy: {}", proxy_url);
        config_builder = config_builder.arg(format!("--proxy-server={}", proxy_url));
    }

    let config = config_builder
        .build()
        .map_err(|e| AppError::Browser(format!("Failed to build browser config: {}", e)))?;

    let (browser, mut handler) = Browser::launch(config)
        .await
        .map_err(|e| AppError::Browser(format!("Failed to launch browser: {}", e)))?;

    // Spawn handler in background
    let handle = tokio::spawn(async move {
        while handler.next().await.is_some() {
            // Keep handling browser events
        }
    });

    Ok((browser, handle))
}

/// Create a new page in the browser
pub async fn new_page(browser: &Browser) -> Result<Page, AppError> {
    browser.new_page("about:blank")
        .await
        .map_err(|e| AppError::Browser(format!("Failed to create page: {}", e)))
}

/// Helper functions for page interactions
pub mod page_utils {
    use chromiumoxide::Page;
    use crate::error::AppError;
    use std::time::Duration;

    /// Navigate to a URL and wait for load
    pub async fn navigate(page: &Page, url: &str) -> Result<(), AppError> {
        page.goto(url)
            .await
            .map_err(|e| AppError::Browser(format!("Navigation failed: {}", e)))?;
        
        tokio::time::sleep(Duration::from_millis(500)).await;
        Ok(())
    }

    /// Wait for an element to appear
    pub async fn wait_for_selector(
        page: &Page,
        selector: &str,
        timeout_ms: u64,
    ) -> Result<(), AppError> {
        let start = std::time::Instant::now();
        let timeout = Duration::from_millis(timeout_ms);

        loop {
            if start.elapsed() > timeout {
                return Err(AppError::Browser(format!(
                    "Timeout waiting for selector: {}",
                    selector
                )));
            }

            let elements = page.find_elements(selector)
                .await
                .map_err(|e| AppError::Browser(format!("Error finding elements: {}", e)))?;

            if !elements.is_empty() {
                return Ok(());
            }

            tokio::time::sleep(Duration::from_millis(100)).await;
        }
    }

    /// Select an option from a dropdown
    pub async fn select_option(
        page: &Page,
        selector: &str,
        value: &str,
    ) -> Result<(), AppError> {
        let js = format!(
            r#"
            const select = document.querySelector('{}');
            if (select) {{
                select.value = '{}';
                select.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
            "#,
            selector, value
        );

        page.evaluate(js)
            .await
            .map_err(|e| AppError::Browser(format!("Failed to select option: {}", e)))?;

        tokio::time::sleep(Duration::from_millis(500)).await;
        Ok(())
    }

    /// Type text into an input field
    pub async fn type_text(
        page: &Page,
        selector: &str,
        text: &str,
    ) -> Result<(), AppError> {
        let element = page.find_element(selector)
            .await
            .map_err(|e| AppError::Browser(format!("Element not found: {}", e)))?;

        element.click()
            .await
            .map_err(|e| AppError::Browser(format!("Click failed: {}", e)))?;

        element.type_str(text)
            .await
            .map_err(|e| AppError::Browser(format!("Typing failed: {}", e)))?;

        Ok(())
    }

    /// Click a button
    pub async fn click(page: &Page, selector: &str) -> Result<(), AppError> {
        let element = page.find_element(selector)
            .await
            .map_err(|e| AppError::Browser(format!("Element not found: {}", e)))?;

        element.click()
            .await
            .map_err(|e| AppError::Browser(format!("Click failed: {}", e)))?;

        tokio::time::sleep(Duration::from_millis(500)).await;
        Ok(())
    }

    /// Get page HTML content
    pub async fn get_html(page: &Page) -> Result<String, AppError> {
        page.content()
            .await
            .map_err(|e| AppError::Browser(format!("Failed to get HTML: {}", e)))
    }

    /// Take a page screenshot
    pub async fn screenshot(page: &Page) -> Result<Vec<u8>, AppError> {
        page.screenshot(
            chromiumoxide::page::ScreenshotParams::builder()
                .full_page(false)
                .build()
        )
        .await
        .map_err(|e| AppError::Browser(format!("Screenshot failed: {}", e)))
    }

    /// Get element screenshot (for CAPTCHA image)
    pub async fn element_screenshot(
        page: &Page,
        selector: &str,
    ) -> Result<Vec<u8>, AppError> {
        let element = page.find_element(selector)
            .await
            .map_err(|e| AppError::Browser(format!("Element not found: {}", e)))?;

        element.screenshot(chromiumoxide::cdp::browser_protocol::page::CaptureScreenshotFormat::Png)
            .await
            .map_err(|e| AppError::Browser(format!("Element screenshot failed: {}", e)))
    }
}
