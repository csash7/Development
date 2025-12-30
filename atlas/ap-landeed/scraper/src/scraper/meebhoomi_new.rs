//! New Meebhoomi scraper for the OTP-based portal
//!
//! The Meebhoomi website has been redesigned and now requires
//! mobile OTP authentication to access land records.

use chromiumoxide::Page;
use std::time::Duration;

use super::browser::page_utils;
use crate::error::AppError;
use crate::sms_activate::{SmsActivateClient, PhoneActivation};

const MEEBHOOMI_URL: &str = "https://meebhoomi.ap.gov.in";

/// Meebhoomi session with OTP authentication
pub struct MeebhoomiSession {
    pub phone_activation: PhoneActivation,
    pub is_authenticated: bool,
}

/// Authenticate with Meebhoomi using SMS-Activate for OTP
pub async fn authenticate_with_otp(
    page: &Page,
    sms_client: &SmsActivateClient,
) -> Result<MeebhoomiSession, AppError> {
    tracing::info!("Starting Meebhoomi OTP authentication...");

    // Step 1: Navigate to Meebhoomi
    page_utils::navigate(page, MEEBHOOMI_URL).await?;
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Step 2: Get a virtual India phone number
    let phone_activation = sms_client.get_number().await?;
    tracing::info!("Got virtual number: {}", phone_activation.phone_number);

    // Step 3: Find and fill the mobile number field
    // Based on the new portal design, look for the login form
    let mobile_selectors = vec![
        "input[placeholder*='Mobile']",
        "#txtMobile",
        "input[type='tel']",
        "input[name*='mobile']",
    ];

    let mut found_input = false;
    for selector in &mobile_selectors {
        if page_utils::wait_for_selector(page, selector, 2000).await.is_ok() {
            // Enter the phone number (remove +91 prefix if present)
            let phone = phone_activation.phone_number
                .trim_start_matches("+91")
                .trim_start_matches("91");
            
            page_utils::type_text(page, selector, phone).await?;
            found_input = true;
            tracing::info!("Entered phone number in {}", selector);
            break;
        }
    }

    if !found_input {
        sms_client.cancel_activation(&phone_activation.activation_id).await?;
        return Err(AppError::Browser("Could not find mobile input field".to_string()));
    }

    // Step 4: Click "Get OTP" button
    let otp_button_selectors = vec![
        "button:contains('OTP')",
        "button:contains('Get')",
        "#btnGetOTP",
        "button[type='submit']",
        ".btn-primary",
    ];

    for selector in &otp_button_selectors {
        if page_utils::click(page, selector).await.is_ok() {
            tracing::info!("Clicked OTP button: {}", selector);
            break;
        }
    }

    // Wait a moment for OTP request to be sent
    tokio::time::sleep(Duration::from_secs(2)).await;

    // Step 5: Wait for OTP via SMS-Activate
    tracing::info!("Waiting for OTP SMS...");
    let sms_code = sms_client.wait_for_code(
        &phone_activation.activation_id,
        120, // 2 minute timeout
    ).await?;

    // Extract the numeric OTP from SMS
    let otp = SmsActivateClient::extract_otp(&sms_code)
        .unwrap_or(sms_code.clone());
    
    tracing::info!("Received OTP: {}", otp);

    // Step 6: Enter OTP
    let otp_input_selectors = vec![
        "input[placeholder*='OTP']",
        "#txtOTP",
        "input[name*='otp']",
        "input[maxlength='6']",
    ];

    for selector in &otp_input_selectors {
        if page_utils::wait_for_selector(page, selector, 2000).await.is_ok() {
            page_utils::type_text(page, selector, &otp).await?;
            tracing::info!("Entered OTP in {}", selector);
            break;
        }
    }

    // Step 7: Click verify/submit button
    let verify_button_selectors = vec![
        "button:contains('Verify')",
        "button:contains('Submit')",
        "button:contains('Login')",
        "#btnVerify",
        "button[type='submit']",
    ];

    for selector in &verify_button_selectors {
        if page_utils::click(page, selector).await.is_ok() {
            tracing::info!("Clicked verify button: {}", selector);
            break;
        }
    }

    // Wait for authentication to complete
    tokio::time::sleep(Duration::from_secs(3)).await;

    // Check if we're authenticated (look for dashboard elements or user profile)
    let is_authenticated = check_authenticated(page).await;

    if is_authenticated {
        tracing::info!("Successfully authenticated with Meebhoomi!");
    } else {
        tracing::warn!("Authentication may have failed - verify manually");
    }

    Ok(MeebhoomiSession {
        phone_activation: PhoneActivation {
            activation_id: phone_activation.activation_id,
            phone_number: phone_activation.phone_number,
            status: crate::sms_activate::ActivationStatus::CodeReceived(otp),
            sms_code: Some(sms_code),
        },
        is_authenticated,
    })
}

/// Check if we're authenticated (look for dashboard elements)
async fn check_authenticated(page: &Page) -> bool {
    // Look for signs we're logged in
    let auth_indicators = vec![
        // User profile elements
        "a[href*='logout']",
        "button:contains('Logout')",
        // Dashboard elements
        ".dashboard",
        "#userProfile",
        // Any post-login menu items
        "a:contains('Mutation')",
        "a:contains('Land')",
    ];

    for selector in &auth_indicators {
        if page_utils::wait_for_selector(page, selector, 1000).await.is_ok() {
            return true;
        }
    }

    false
}

/// Navigate to land records section after authentication
pub async fn navigate_to_land_records(page: &Page) -> Result<(), AppError> {
    // Look for land records / ROR links
    let land_record_selectors = vec![
        "a:contains('Land Records')",
        "a:contains('1B')",
        "a:contains('ROR')",
        "a:contains('Adangal')",
        ".menu-land-records",
    ];

    for selector in &land_record_selectors {
        if page_utils::click(page, selector).await.is_ok() {
            tracing::info!("Navigated to land records: {}", selector);
            tokio::time::sleep(Duration::from_secs(2)).await;
            return Ok(());
        }
    }

    Err(AppError::Browser("Could not find land records section".to_string()))
}

/// Scraped land record from new Meebhoomi portal
#[derive(Debug, Clone)]
pub struct ScrapedRecord {
    pub survey_number: String,
    pub district: String,
    pub mandal: String,
    pub village: String,
    pub khata_number: Option<String>,
    pub owner_name: Option<String>,
    pub extent: Option<String>,
    pub raw_html: String,
}

/// Search for a land record after authentication
pub async fn search_land_record(
    page: &Page,
    district: &str,
    mandal: &str,
    village: &str,
    survey_number: &str,
) -> Result<ScrapedRecord, AppError> {
    tracing::info!(
        "Searching for land record: {}/{}/{}/{}",
        district, mandal, village, survey_number
    );

    // TODO: Implement the actual search flow after analyzing the new portal structure
    // This will need to be updated once we can access the authenticated portal

    // Placeholder - get raw HTML for analysis
    let html = page_utils::get_html(page).await?;

    Err(AppError::Scraper(format!(
        "Land record search not yet implemented for new portal. HTML length: {} chars",
        html.len()
    )))
}
