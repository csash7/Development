//! Telangana BhuBharati Scraper
//!
//! Scrapes land records from https://bhubharati.telangana.gov.in/knowLandStatus
//! Authentication: None required
//! Captcha: Simple image captcha

use chromiumoxide::Page;
use std::time::Duration;
use scraper::{Html, Selector};

use super::browser::{self, page_utils};
use super::captcha;
use crate::error::AppError;

const BASE_URL: &str = "https://bhubharati.telangana.gov.in/knowLandStatus";

/// Scrape land record by survey number
pub async fn scrape_by_survey_no(
    page: &Page,
    district_id: &str,
    mandal_id: &str,
    village_id: &str,
    survey_no: &str,
    captcha_solver: Option<&captcha::CaptchaSolver>,
) -> Result<super::meebhoomi::ScrapedLandRecord, AppError> {
    tracing::info!("Navigating to BhuBharati portal...");
    page_utils::navigate(page, BASE_URL).await?;

    // Wait for district dropdown
    page_utils::wait_for_selector(page, "#districtID", 10000).await?;

    // Select District
    tracing::info!("Selecting district: {}", district_id);
    page_utils::select_option(page, "#districtID", district_id).await?;
    
    // Trigger change event and wait for mandal dropdown
    page.evaluate("document.getElementById('districtID').dispatchEvent(new Event('change'))").await
        .map_err(|e| AppError::Browser(format!("Failed to trigger district change: {}", e)))?;
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Select Mandal
    tracing::info!("Selecting mandal: {}", mandal_id);
    page_utils::select_option(page, "#mandalID", mandal_id).await?;
    
    // Trigger change event and wait for village dropdown
    page.evaluate("document.getElementById('mandalID').dispatchEvent(new Event('change'))").await
        .map_err(|e| AppError::Browser(format!("Failed to trigger mandal change: {}", e)))?;
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Select Village
    tracing::info!("Selecting village: {}", village_id);
    page_utils::select_option(page, "#villageId", village_id).await?;

    // Trigger change event and wait for survey dropdown
    page.evaluate("document.getElementById('villageId').dispatchEvent(new Event('change'))").await
        .map_err(|e| AppError::Browser(format!("Failed to trigger village change: {}", e)))?;
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Select Survey No
    // Note: The UI might use a text input or a dropdown for survey no based on the village
    // From exploration, it seems to be #surveyIdselect
    tracing::info!("Selecting survey number: {}", survey_no);
    
    // Check if survey select exists
    if page_utils::wait_for_selector(page, "#surveyIdselect", 3000).await.is_ok() {
         page_utils::select_option(page, "#surveyIdselect", survey_no).await?;
    } else {
        // Might be text input in some cases? Or just didn't load.
        // Let's assume text input if select not found, or maybe we need to search through options
        return Err(AppError::Scraper("Survey number dropdown not found".to_string()));
    }

    // Solve Captcha
    tracing::info!("Solving CAPTCHA...");
    
    // Find captcha image
    let captcha_img_selector = "#imgcapcha"; // Note: ID from exploration might be off, checking typically it's an img tag
    // From manual exploration: img with id 'imgcapcha' is likely. 
    // Wait for it to be visible
    page_utils::wait_for_selector(page, "img#imgcapcha", 5000).await?;

    // Capture screenshot of the captcha element
    let captcha_element = page.find_element("img#imgcapcha").await
        .map_err(|e| AppError::Browser(format!("Failed to find captcha image: {}", e)))?;
    
    let captcha_png = captcha_element.screenshot(chromiumoxide::cdp::browser_protocol::page::CaptureScreenshotFormat::Png)
        .await
        .map_err(|e| AppError::Browser(format!("Failed to screenshot captcha: {}", e)))?;

    // Solve it
    // Use OCR first as it's a simple image
    let captcha_text = if let Some(solver) = captcha_solver {
        solver.solve(&captcha_png).await?
    } else {
        // Fallback or error if no solver provided
        return Err(AppError::Internal("No captcha solver available".to_string()));
    };

    tracing::info!("Captcha solved: {}", captcha_text);

    // Enter Captcha
    page_utils::type_text(page, "#captchavalue", &captcha_text).await?;

    // Click Fetch
    // Button is usually "Fetch" or "Get Details"
    // From exploration: input.btn.bg-green.btn-sm
    let fetch_btn_selector = "input[value='Fetch']"; 
    page_utils::click(page, fetch_btn_selector).await?;

    // Wait for results
    // Wait for either success (table) or error (alert/text)
    tokio::time::sleep(Duration::from_secs(3)).await;

    // Check for results
    let html = page_utils::get_html(page).await?;
    
    // Parse results
    parse_results(&html)
}

fn parse_results(html: &str) -> Result<super::meebhoomi::ScrapedLandRecord, AppError> {
    let document = Html::parse_document(html);
    
    // Selector for result table
    // This needs adjustment based on actual result structure. 
    // Assuming a table exists with class 'table' or similar.
    let table_selector = Selector::parse("table").unwrap();
    
    if document.select(&table_selector).next().is_some() {
        // Found a table, let's extract generic data for now
        // Modify this based on actual table columns
        
        Ok(super::meebhoomi::ScrapedLandRecord {
            survey_number: "Unknown".to_string(), // Need to parse from response
            sub_division: None,
            district_code: "Unknown".to_string(),
            mandal_code: "Unknown".to_string(),
            village_code: "Unknown".to_string(),
            khata_number: None,
            patta_number: None,
            extent_acres: None,
            extent_guntas: None,
            extent_cents: None,
            land_classification: None,
            land_nature: None,
            water_source: None,
            owners: vec![],
            raw_html: html.to_string(),
            source_url: BASE_URL.to_string(),
        })
    } else {
        // Check for error messages
        if html.contains("Invalid Captcha") {
            Err(AppError::Captcha("Invalid Captcha".to_string()))
        } else if html.contains("No Details Found") {
             Err(AppError::Scraper("No records found".to_string()))
        } else {
             Ok(super::meebhoomi::ScrapedLandRecord {
                survey_number: "".to_string(),
                sub_division: None,
                district_code: "".to_string(),
                mandal_code: "".to_string(),
                village_code: "".to_string(),
                khata_number: None,
                patta_number: None,
                extent_acres: None,
                extent_guntas: None,
                extent_cents: None,
                land_classification: None,
                land_nature: None,
                water_source: None,
                owners: vec![],
                raw_html: html.to_string(),
                source_url: BASE_URL.to_string(),
            })
        }
    }
}
