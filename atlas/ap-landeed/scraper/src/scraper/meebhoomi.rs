//! Meebhoomi scraper for 1B and Adangal documents

use chromiumoxide::Page;
use std::collections::HashMap;

use super::browser::page_utils;
use crate::error::AppError;
use crate::models::{LandRecord, LandOwner};

const MEEBHOOMI_URL: &str = "https://meebhoomi.ap.gov.in";
const MEEBHOOMI_1B_URL: &str = "https://meebhoomi.ap.gov.in/ROR.aspx";
const MEEBHOOMI_ADANGAL_URL: &str = "https://meebhoomi.ap.gov.in/Adangal.aspx";

/// Scraped land record data before database insertion
#[derive(Debug, Clone)]
pub struct ScrapedLandRecord {
    pub survey_number: String,
    pub sub_division: Option<String>,
    pub district_code: String,
    pub mandal_code: String,
    pub village_code: String,
    pub khata_number: Option<String>,
    pub patta_number: Option<String>,
    pub extent_acres: Option<f64>,
    pub extent_guntas: Option<f64>,
    pub extent_cents: Option<f64>,
    pub land_classification: Option<String>,
    pub land_nature: Option<String>,
    pub water_source: Option<String>,
    pub owners: Vec<ScrapedOwner>,
    pub raw_html: String,
    pub source_url: String,
}

#[derive(Debug, Clone)]
pub struct ScrapedOwner {
    pub name: String,
    pub name_telugu: Option<String>,
    pub father_name: Option<String>,
    pub share_percentage: Option<f64>,
}

/// Scrape 1B (Record of Rights) from Meebhoomi
pub async fn scrape_1b(
    page: &Page,
    district_code: &str,
    mandal_code: &str,
    village_code: &str,
    survey_number: &str,
    captcha_solution: Option<&str>,
) -> Result<ScrapedLandRecord, AppError> {
    tracing::info!(
        district = district_code,
        mandal = mandal_code,
        village = village_code,
        survey = survey_number,
        "Starting 1B scrape"
    );

    // Navigate to 1B page
    page_utils::navigate(page, MEEBHOOMI_1B_URL).await?;
    
    // Wait for page to load
    page_utils::wait_for_selector(page, "#ctl00_ContentPlaceHolder1_ddlDist", 10000).await?;

    // Select district
    page_utils::select_option(
        page,
        "#ctl00_ContentPlaceHolder1_ddlDist",
        district_code,
    ).await?;

    // Wait for mandals to load
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    // Select mandal
    page_utils::select_option(
        page,
        "#ctl00_ContentPlaceHolder1_ddlMandal",
        mandal_code,
    ).await?;

    // Wait for villages to load
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    // Select village
    page_utils::select_option(
        page,
        "#ctl00_ContentPlaceHolder1_ddlVillage",
        village_code,
    ).await?;

    // Enter survey number
    page_utils::type_text(
        page,
        "#ctl00_ContentPlaceHolder1_txtSurveyNo",
        survey_number,
    ).await?;

    // Handle CAPTCHA - try automated solving first
    let captcha_solution = if let Some(solution) = captcha_solution {
        solution.to_string()
    } else {
        // Capture CAPTCHA image
        let captcha_image = capture_captcha_image(page).await?;
        
        // Try automated solving
        let solver = super::captcha::CaptchaSolver::new(super::captcha::CaptchaConfig::default());
        match solver.solve(&captcha_image).await {
            Ok(solution) => {
                tracing::info!("CAPTCHA auto-solved: {}", solution);
                solution
            }
            Err(e) => {
                tracing::warn!("Auto-solve failed: {}. Returning for manual solving.", e);
                // Return error with CAPTCHA image for manual fallback
                return Err(AppError::Scraper(format!(
                    "CAPTCHA_REQUIRED:{}",
                    super::captcha::encode_captcha_image(&captcha_image)
                )));
            }
        }
    };
    
    // Enter CAPTCHA solution
    page_utils::type_text(
        page,
        "#ctl00_ContentPlaceHolder1_txtcaptcha",
        &captcha_solution,
    ).await?;

    // Click submit/search button
    page_utils::click(page, "#ctl00_ContentPlaceHolder1_btnSearch").await?;

    // Wait for results
    tokio::time::sleep(std::time::Duration::from_millis(2000)).await;

    // Get page HTML
    let html = page_utils::get_html(page).await?;

    // Parse the results
    let record = parse_1b_html(&html, district_code, mandal_code, village_code)?;

    tracing::info!(
        survey = %record.survey_number,
        owners = record.owners.len(),
        "1B scrape completed"
    );

    Ok(record)
}

/// Capture CAPTCHA image from the page
pub async fn capture_captcha_image(page: &Page) -> Result<Vec<u8>, AppError> {
    // Try to find and screenshot the CAPTCHA image element
    let captcha_selectors = vec![
        "#ctl00_ContentPlaceHolder1_imgCaptcha",
        "img[src*='captcha']",
        ".captcha-image",
    ];

    for selector in captcha_selectors {
        if let Ok(image) = page_utils::element_screenshot(page, selector).await {
            return Ok(image);
        }
    }

    // Fallback: take full page screenshot
    page_utils::screenshot(page).await
}

/// Parse 1B HTML to extract land record data
fn parse_1b_html(
    html: &str,
    district_code: &str,
    mandal_code: &str,
    village_code: &str,
) -> Result<ScrapedLandRecord, AppError> {
    // This is a simplified parser - in production, use scraper crate with proper selectors
    // The actual Meebhoomi page structure would need to be analyzed
    
    // For now, create a placeholder that would be filled with actual parsing logic
    // based on the Meebhoomi page structure
    
    // Check if we got an error message
    if html.contains("No Records Found") || html.contains("లేవు") {
        return Err(AppError::NotFound("No land records found".to_string()));
    }

    // TODO: Implement actual HTML parsing with scraper crate
    // This would extract:
    // - Survey number and sub-division
    // - Khata number
    // - Owner details (name, father name, share %)
    // - Extent (acres, guntas, cents)
    // - Land classification
    // - Water source

    // Placeholder return for now
    Err(AppError::Scraper(
        "HTML parsing not yet implemented. Raw HTML captured for manual review.".to_string()
    ))
}

/// Scrape Adangal (Village Account) from Meebhoomi
pub async fn scrape_adangal(
    page: &Page,
    district_code: &str,
    mandal_code: &str,
    village_code: &str,
    survey_number: &str,
    captcha_solution: Option<&str>,
) -> Result<ScrapedLandRecord, AppError> {
    tracing::info!(
        district = district_code,
        mandal = mandal_code,
        village = village_code,
        survey = survey_number,
        "Starting Adangal scrape"
    );

    // Navigate to Adangal page
    page_utils::navigate(page, MEEBHOOMI_ADANGAL_URL).await?;

    // Similar flow to 1B scraping...
    // The page structure and selectors might differ slightly

    // Wait for page to load
    page_utils::wait_for_selector(page, "#ctl00_ContentPlaceHolder1_ddlDist", 10000).await?;

    // Select location (same as 1B)
    page_utils::select_option(page, "#ctl00_ContentPlaceHolder1_ddlDist", district_code).await?;
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    page_utils::select_option(page, "#ctl00_ContentPlaceHolder1_ddlMandal", mandal_code).await?;
    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

    page_utils::select_option(page, "#ctl00_ContentPlaceHolder1_ddlVillage", village_code).await?;

    // Enter survey number
    page_utils::type_text(
        page,
        "#ctl00_ContentPlaceHolder1_txtSurveyNo",
        survey_number,
    ).await?;

    // Handle CAPTCHA - try automated solving first
    let captcha_solution = if let Some(solution) = captcha_solution {
        solution.to_string()
    } else {
        let captcha_image = capture_captcha_image(page).await?;
        
        let solver = super::captcha::CaptchaSolver::new(super::captcha::CaptchaConfig::default());
        match solver.solve(&captcha_image).await {
            Ok(solution) => {
                tracing::info!("CAPTCHA auto-solved: {}", solution);
                solution
            }
            Err(e) => {
                tracing::warn!("Auto-solve failed: {}", e);
                return Err(AppError::Scraper(format!(
                    "CAPTCHA_REQUIRED:{}",
                    super::captcha::encode_captcha_image(&captcha_image)
                )));
            }
        }
    };
    
    page_utils::type_text(
        page,
        "#ctl00_ContentPlaceHolder1_txtcaptcha",
        &captcha_solution,
    ).await?;

    // Submit
    page_utils::click(page, "#ctl00_ContentPlaceHolder1_btnSearch").await?;
    tokio::time::sleep(std::time::Duration::from_millis(2000)).await;

    // Get HTML
    let html = page_utils::get_html(page).await?;

    // Parse (similar structure to 1B but with additional Adangal-specific fields)
    let record = parse_adangal_html(&html, district_code, mandal_code, village_code)?;

    Ok(record)
}

/// Parse Adangal HTML
fn parse_adangal_html(
    html: &str,
    district_code: &str,
    mandal_code: &str,
    village_code: &str,
) -> Result<ScrapedLandRecord, AppError> {
    // Similar to parse_1b_html but handles Adangal-specific fields
    // like crop details, soil type, etc.
    
    if html.contains("No Records Found") || html.contains("లేవు") {
        return Err(AppError::NotFound("No land records found".to_string()));
    }

    // TODO: Implement actual Adangal parsing
    Err(AppError::Scraper(
        "Adangal parsing not yet implemented.".to_string()
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_empty_html() {
        let html = "No Records Found";
        let result = parse_1b_html(html, "VSK", "VSK04", "VSK04R01");
        assert!(result.is_err());
    }
}
