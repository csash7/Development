//! SMS-Activate API integration for virtual phone numbers
//!
//! Used to get temporary Indian phone numbers and receive OTPs
//! for Meebhoomi authentication.
//!
//! API Docs: https://sms-activate.org/en/api2

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::error::AppError;

const API_BASE: &str = "https://api.sms-activate.org/stubs/handler_api.php";

// India country code for SMS-Activate
const INDIA_COUNTRY_CODE: &str = "22";

// Service code for "other" (generic SMS verification)
// You may need to find the specific code for Meebhoomi if available
const SERVICE_CODE: &str = "ot"; // "other" service

/// SMS-Activate client for managing virtual numbers
pub struct SmsActivateClient {
    api_key: String,
    http_client: Client,
}

impl SmsActivateClient {
    /// Create a new SMS-Activate client
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            http_client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap_or_default(),
        }
    }

    /// Create from environment variable
    pub fn from_env() -> Option<Self> {
        std::env::var("SMS_ACTIVATE_API_KEY")
            .ok()
            .map(|key| Self::new(key))
    }

    /// Get account balance
    pub async fn get_balance(&self) -> Result<f64, AppError> {
        let url = format!(
            "{}?api_key={}&action=getBalance",
            API_BASE, self.api_key
        );

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("SMS-Activate request failed: {}", e)))?;

        let text = response.text().await
            .map_err(|e| AppError::Internal(format!("Failed to read response: {}", e)))?;

        // Response format: ACCESS_BALANCE:123.45
        if text.starts_with("ACCESS_BALANCE:") {
            let balance_str = text.trim_start_matches("ACCESS_BALANCE:");
            balance_str.parse::<f64>()
                .map_err(|_| AppError::Internal("Invalid balance format".to_string()))
        } else {
            Err(AppError::Internal(format!("SMS-Activate error: {}", text)))
        }
    }

    /// Get a virtual India phone number
    pub async fn get_number(&self) -> Result<PhoneActivation, AppError> {
        let url = format!(
            "{}?api_key={}&action=getNumber&service={}&country={}",
            API_BASE, self.api_key, SERVICE_CODE, INDIA_COUNTRY_CODE
        );

        tracing::info!("Requesting India virtual number from SMS-Activate");

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("SMS-Activate request failed: {}", e)))?;

        let text = response.text().await
            .map_err(|e| AppError::Internal(format!("Failed to read response: {}", e)))?;

        tracing::debug!("SMS-Activate response: {}", text);

        // Response format: ACCESS_NUMBER:activation_id:phone_number
        // Example: ACCESS_NUMBER:123456789:79001234567
        if text.starts_with("ACCESS_NUMBER:") {
            let parts: Vec<&str> = text.trim_start_matches("ACCESS_NUMBER:").split(':').collect();
            if parts.len() >= 2 {
                let activation_id = parts[0].to_string();
                let phone_number = parts[1].to_string();
                
                tracing::info!("Got phone number: {} (activation: {})", phone_number, activation_id);
                
                return Ok(PhoneActivation {
                    activation_id,
                    phone_number,
                    status: ActivationStatus::Waiting,
                    sms_code: None,
                });
            }
        }

        // Handle error responses
        match text.as_str() {
            "NO_NUMBERS" => Err(AppError::Internal("No India numbers available. Try again later.".to_string())),
            "NO_BALANCE" => Err(AppError::Internal("Insufficient SMS-Activate balance. Please top up.".to_string())),
            "BAD_KEY" => Err(AppError::Internal("Invalid SMS-Activate API key.".to_string())),
            _ => Err(AppError::Internal(format!("SMS-Activate error: {}", text))),
        }
    }

    /// Check status and get SMS code
    pub async fn get_status(&self, activation_id: &str) -> Result<ActivationStatus, AppError> {
        let url = format!(
            "{}?api_key={}&action=getStatus&id={}",
            API_BASE, self.api_key, activation_id
        );

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("SMS-Activate request failed: {}", e)))?;

        let text = response.text().await
            .map_err(|e| AppError::Internal(format!("Failed to read response: {}", e)))?;

        tracing::debug!("Activation {} status: {}", activation_id, text);

        // Parse status response
        if text.starts_with("STATUS_OK:") {
            // SMS received! Extract the code
            let code = text.trim_start_matches("STATUS_OK:").to_string();
            Ok(ActivationStatus::CodeReceived(code))
        } else {
            match text.as_str() {
                "STATUS_WAIT_CODE" => Ok(ActivationStatus::Waiting),
                "STATUS_WAIT_RESEND" => Ok(ActivationStatus::WaitingResend),
                "STATUS_CANCEL" => Ok(ActivationStatus::Cancelled),
                _ => Err(AppError::Internal(format!("Unknown status: {}", text))),
            }
        }
    }

    /// Wait for SMS code with timeout
    pub async fn wait_for_code(
        &self,
        activation_id: &str,
        timeout_seconds: u64,
    ) -> Result<String, AppError> {
        let start = std::time::Instant::now();
        let timeout = Duration::from_secs(timeout_seconds);

        tracing::info!("Waiting for SMS code (timeout: {}s)...", timeout_seconds);

        loop {
            if start.elapsed() > timeout {
                // Cancel the activation on timeout
                let _ = self.set_status(activation_id, "8").await; // 8 = cancel
                return Err(AppError::Internal("Timeout waiting for SMS code".to_string()));
            }

            match self.get_status(activation_id).await? {
                ActivationStatus::CodeReceived(code) => {
                    tracing::info!("Received SMS code: {}", code);
                    // Confirm activation was successful
                    let _ = self.set_status(activation_id, "6").await; // 6 = confirm
                    return Ok(code);
                }
                ActivationStatus::Cancelled => {
                    return Err(AppError::Internal("Activation was cancelled".to_string()));
                }
                ActivationStatus::Waiting | ActivationStatus::WaitingResend => {
                    // Keep waiting
                    tokio::time::sleep(Duration::from_secs(3)).await;
                }
            }
        }
    }

    /// Set activation status
    pub async fn set_status(&self, activation_id: &str, status: &str) -> Result<(), AppError> {
        let url = format!(
            "{}?api_key={}&action=setStatus&id={}&status={}",
            API_BASE, self.api_key, activation_id, status
        );

        let response = self.http_client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::Internal(format!("SMS-Activate request failed: {}", e)))?;

        let text = response.text().await
            .map_err(|e| AppError::Internal(format!("Failed to read response: {}", e)))?;

        if text.starts_with("ACCESS_") {
            Ok(())
        } else {
            Err(AppError::Internal(format!("Failed to set status: {}", text)))
        }
    }

    /// Cancel an activation and get refund
    pub async fn cancel_activation(&self, activation_id: &str) -> Result<(), AppError> {
        self.set_status(activation_id, "8").await
    }

    /// Extract OTP from SMS text
    /// Meebhoomi OTPs are typically 6 digits
    pub fn extract_otp(sms_text: &str) -> Option<String> {
        // Look for 4-6 digit codes in the SMS
        let re = regex::Regex::new(r"\b(\d{4,6})\b").ok()?;
        re.captures(sms_text)
            .and_then(|cap| cap.get(1))
            .map(|m| m.as_str().to_string())
    }
}

/// Phone activation details
#[derive(Debug, Clone)]
pub struct PhoneActivation {
    pub activation_id: String,
    pub phone_number: String,
    pub status: ActivationStatus,
    pub sms_code: Option<String>,
}

/// Activation status
#[derive(Debug, Clone, PartialEq)]
pub enum ActivationStatus {
    Waiting,
    WaitingResend,
    CodeReceived(String),
    Cancelled,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_otp() {
        assert_eq!(
            SmsActivateClient::extract_otp("Your OTP is 123456"),
            Some("123456".to_string())
        );
        assert_eq!(
            SmsActivateClient::extract_otp("Use 4567 to verify"),
            Some("4567".to_string())
        );
        assert_eq!(
            SmsActivateClient::extract_otp("No code here"),
            None
        );
    }
}
