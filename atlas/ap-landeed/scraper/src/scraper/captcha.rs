//! Automated CAPTCHA solving module
//!
//! Supports multiple solving methods:
//! 1. Third-party services (2Captcha, Anti-Captcha)
//! 2. OCR-based solving (Tesseract via command-line)
//! 3. Manual fallback via admin dashboard

use base64::{Engine, engine::general_purpose::STANDARD};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use uuid::Uuid;

use crate::error::AppError;

// =============================================================================
// Configuration
// =============================================================================

#[derive(Debug, Clone)]
pub struct CaptchaConfig {
    /// 2Captcha API key (if using)
    pub two_captcha_api_key: Option<String>,
    /// Anti-Captcha API key (if using)
    pub anti_captcha_api_key: Option<String>,
    /// Whether to try OCR before paid services
    pub try_ocr_first: bool,
    /// Whether to fallback to manual solving
    pub allow_manual_fallback: bool,
    /// Maximum wait time for solution (seconds)
    pub timeout_seconds: u64,
}

impl Default for CaptchaConfig {
    fn default() -> Self {
        Self {
            two_captcha_api_key: std::env::var("TWO_CAPTCHA_API_KEY").ok(),
            anti_captcha_api_key: std::env::var("ANTI_CAPTCHA_API_KEY").ok(),
            try_ocr_first: true,
            allow_manual_fallback: true,
            timeout_seconds: 120,
        }
    }
}

// =============================================================================
// CAPTCHA Solver
// =============================================================================

pub struct CaptchaSolver {
    config: CaptchaConfig,
    http_client: Client,
}

impl CaptchaSolver {
    pub fn new(config: CaptchaConfig) -> Self {
        Self {
            config,
            http_client: Client::builder()
                .timeout(Duration::from_secs(30))
                .build()
                .unwrap_or_default(),
        }
    }

    /// Attempt to solve a CAPTCHA image using configured methods
    pub async fn solve(&self, image_bytes: &[u8]) -> Result<String, AppError> {
        tracing::info!("Attempting to solve CAPTCHA ({} bytes)", image_bytes.len());

        // Step 1: Try OCR first if enabled (free and instant)
        if self.config.try_ocr_first {
            match self.solve_with_ocr(image_bytes).await {
                Ok(solution) => {
                    tracing::info!("OCR solved CAPTCHA: {}", solution);
                    return Ok(solution);
                }
                Err(e) => {
                    tracing::warn!("OCR failed: {}", e);
                }
            }
        }

        // Step 2: Try 2Captcha if API key is configured
        if let Some(ref api_key) = self.config.two_captcha_api_key {
            match self.solve_with_2captcha(api_key, image_bytes).await {
                Ok(solution) => {
                    tracing::info!("2Captcha solved CAPTCHA");
                    return Ok(solution);
                }
                Err(e) => {
                    tracing::warn!("2Captcha failed: {}", e);
                }
            }
        }

        // Step 3: Try Anti-Captcha if API key is configured
        if let Some(ref api_key) = self.config.anti_captcha_api_key {
            match self.solve_with_anticaptcha(api_key, image_bytes).await {
                Ok(solution) => {
                    tracing::info!("Anti-Captcha solved CAPTCHA");
                    return Ok(solution);
                }
                Err(e) => {
                    tracing::warn!("Anti-Captcha failed: {}", e);
                }
            }
        }

        // No automated solution available
        Err(AppError::Scraper(
            "No CAPTCHA solving method succeeded. Configure TWO_CAPTCHA_API_KEY or ANTI_CAPTCHA_API_KEY for automated solving.".to_string()
        ))
    }

    /// Solve CAPTCHA using local OCR (Tesseract)
    async fn solve_with_ocr(&self, image_bytes: &[u8]) -> Result<String, AppError> {
        // Save image to temp file
        let temp_path = format!("/tmp/captcha_{}.png", Uuid::new_v4());
        
        // Preprocess image for better OCR accuracy
        let preprocessed = self.preprocess_captcha_image(image_bytes)?;
        
        std::fs::write(&temp_path, &preprocessed)
            .map_err(|e| AppError::Internal(format!("Failed to write temp file: {}", e)))?;

        // Run Tesseract OCR
        let output = tokio::process::Command::new("tesseract")
            .arg(&temp_path)
            .arg("stdout")
            .arg("--psm")
            .arg("7")  // Single line of text
            .arg("-c")
            .arg("tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz")
            .output()
            .await
            .map_err(|e| AppError::Internal(format!("Tesseract not installed: {}", e)))?;

        // Clean up temp file
        let _ = std::fs::remove_file(&temp_path);

        if !output.status.success() {
            return Err(AppError::Internal("Tesseract failed".to_string()));
        }

        let text = String::from_utf8_lossy(&output.stdout)
            .trim()
            .replace(' ', "")
            .replace('\n', "");

        if text.is_empty() || text.len() < 3 {
            return Err(AppError::Internal("OCR produced no valid text".to_string()));
        }

        Ok(text)
    }

    /// Preprocess CAPTCHA image for better OCR accuracy
    fn preprocess_captcha_image(&self, image_bytes: &[u8]) -> Result<Vec<u8>, AppError> {
        use image::{GenericImageView, ImageFormat, DynamicImage};
        use image::imageops::FilterType;

        // Load image
        let img = image::load_from_memory(image_bytes)
            .map_err(|e| AppError::Internal(format!("Failed to load image: {}", e)))?;

        // Convert to grayscale
        let gray = img.grayscale();

        // Increase contrast using a simple threshold
        let mut enhanced = gray.to_luma8();
        for pixel in enhanced.pixels_mut() {
            // Simple thresholding to make text clearer
            if pixel.0[0] < 128 {
                pixel.0[0] = 0;   // Make dark pixels black
            } else {
                pixel.0[0] = 255; // Make light pixels white
            }
        }

        // Scale up for better OCR
        let scaled = image::imageops::resize(
            &enhanced,
            enhanced.width() * 2,
            enhanced.height() * 2,
            FilterType::Lanczos3,
        );

        // Encode back to PNG using a cursor
        let mut output = Vec::new();
        use std::io::Cursor;
        use image::ImageEncoder;
        let encoder = image::codecs::png::PngEncoder::new(Cursor::new(&mut output));
        encoder.write_image(
            scaled.as_raw(),
            scaled.width(),
            scaled.height(),
            image::ExtendedColorType::L8,
        ).map_err(|e| AppError::Internal(format!("Failed to encode image: {}", e)))?;

        Ok(output)
    }

    /// Solve CAPTCHA using 2Captcha service
    async fn solve_with_2captcha(&self, api_key: &str, image_bytes: &[u8]) -> Result<String, AppError> {
        let base64_image = STANDARD.encode(image_bytes);

        // Submit CAPTCHA
        #[derive(Serialize)]
        struct SubmitRequest {
            key: String,
            method: String,
            body: String,
            json: u8,
        }

        let submit_response = self.http_client
            .post("http://2captcha.com/in.php")
            .json(&SubmitRequest {
                key: api_key.to_string(),
                method: "base64".to_string(),
                body: base64_image,
                json: 1,
            })
            .send()
            .await
            .map_err(|e| AppError::Scraper(format!("2Captcha submit failed: {}", e)))?;

        #[derive(Deserialize)]
        struct SubmitResponse {
            status: i32,
            request: String,
        }

        let submit_result: SubmitResponse = submit_response.json().await
            .map_err(|e| AppError::Scraper(format!("2Captcha parse failed: {}", e)))?;

        if submit_result.status != 1 {
            return Err(AppError::Scraper(format!("2Captcha error: {}", submit_result.request)));
        }

        let captcha_id = submit_result.request;
        tracing::debug!("2Captcha submitted, ID: {}", captcha_id);

        // Poll for result
        for _ in 0..24 { // Max 2 minutes (24 * 5 seconds)
            tokio::time::sleep(Duration::from_secs(5)).await;

            let result_response = self.http_client
                .get(format!(
                    "http://2captcha.com/res.php?key={}&action=get&id={}&json=1",
                    api_key, captcha_id
                ))
                .send()
                .await
                .map_err(|e| AppError::Scraper(format!("2Captcha poll failed: {}", e)))?;

            let result: SubmitResponse = result_response.json().await
                .map_err(|e| AppError::Scraper(format!("2Captcha result parse failed: {}", e)))?;

            if result.status == 1 {
                return Ok(result.request);
            }

            if result.request != "CAPCHA_NOT_READY" {
                return Err(AppError::Scraper(format!("2Captcha error: {}", result.request)));
            }
        }

        Err(AppError::Scraper("2Captcha timeout".to_string()))
    }

    /// Solve CAPTCHA using Anti-Captcha service
    async fn solve_with_anticaptcha(&self, api_key: &str, image_bytes: &[u8]) -> Result<String, AppError> {
        let base64_image = STANDARD.encode(image_bytes);

        // Create task
        #[derive(Serialize)]
        struct CreateTaskRequest<'a> {
            clientKey: &'a str,
            task: ImageTask,
        }

        #[derive(Serialize)]
        struct ImageTask {
            #[serde(rename = "type")]
            task_type: String,
            body: String,
        }

        let create_response = self.http_client
            .post("https://api.anti-captcha.com/createTask")
            .json(&CreateTaskRequest {
                clientKey: api_key,
                task: ImageTask {
                    task_type: "ImageToTextTask".to_string(),
                    body: base64_image,
                },
            })
            .send()
            .await
            .map_err(|e| AppError::Scraper(format!("Anti-Captcha create failed: {}", e)))?;

        #[derive(Deserialize)]
        struct CreateResponse {
            errorId: i32,
            errorDescription: Option<String>,
            taskId: Option<i64>,
        }

        let create_result: CreateResponse = create_response.json().await
            .map_err(|e| AppError::Scraper(format!("Anti-Captcha parse failed: {}", e)))?;

        if create_result.errorId != 0 {
            return Err(AppError::Scraper(format!(
                "Anti-Captcha error: {}",
                create_result.errorDescription.unwrap_or_default()
            )));
        }

        let task_id = create_result.taskId.ok_or_else(|| {
            AppError::Scraper("Anti-Captcha: no task ID".to_string())
        })?;

        tracing::debug!("Anti-Captcha task created: {}", task_id);

        // Poll for result
        #[derive(Serialize)]
        struct GetResultRequest<'a> {
            clientKey: &'a str,
            taskId: i64,
        }

        #[derive(Deserialize)]
        struct GetResultResponse {
            errorId: i32,
            status: String,
            solution: Option<SolutionResponse>,
        }

        #[derive(Deserialize)]
        struct SolutionResponse {
            text: String,
        }

        for _ in 0..24 {
            tokio::time::sleep(Duration::from_secs(5)).await;

            let result_response = self.http_client
                .post("https://api.anti-captcha.com/getTaskResult")
                .json(&GetResultRequest {
                    clientKey: api_key,
                    taskId: task_id,
                })
                .send()
                .await
                .map_err(|e| AppError::Scraper(format!("Anti-Captcha poll failed: {}", e)))?;

            let result: GetResultResponse = result_response.json().await
                .map_err(|e| AppError::Scraper(format!("Anti-Captcha result parse failed: {}", e)))?;

            if result.status == "ready" {
                if let Some(solution) = result.solution {
                    return Ok(solution.text);
                }
            }

            if result.errorId != 0 {
                return Err(AppError::Scraper("Anti-Captcha solving failed".to_string()));
            }
        }

        Err(AppError::Scraper("Anti-Captcha timeout".to_string()))
    }
}

// =============================================================================
// CAPTCHA Solution Store (for manual solving fallback)
// =============================================================================

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Encode image bytes to base64 for transmission to frontend
pub fn encode_captcha_image(image_bytes: &[u8]) -> String {
    STANDARD.encode(image_bytes)
}

/// Decode base64 CAPTCHA image back to bytes
pub fn decode_captcha_image(base64_string: &str) -> Result<Vec<u8>, AppError> {
    STANDARD.decode(base64_string)
        .map_err(|e| AppError::InvalidInput(format!("Invalid base64: {}", e)))
}

/// CAPTCHA solution store for pending jobs (manual fallback)
pub struct CaptchaStore {
    solutions: Arc<RwLock<HashMap<Uuid, String>>>,
}

impl CaptchaStore {
    pub fn new() -> Self {
        Self {
            solutions: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn store_solution(&self, job_id: Uuid, solution: String) {
        let mut solutions = self.solutions.write().await;
        solutions.insert(job_id, solution);
    }

    pub async fn take_solution(&self, job_id: Uuid) -> Option<String> {
        let mut solutions = self.solutions.write().await;
        solutions.remove(&job_id)
    }

    pub async fn has_solution(&self, job_id: Uuid) -> bool {
        let solutions = self.solutions.read().await;
        solutions.contains_key(&job_id)
    }
}

impl Default for CaptchaStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base64_roundtrip() {
        let original = b"test image data";
        let encoded = encode_captcha_image(original);
        let decoded = decode_captcha_image(&encoded).unwrap();
        assert_eq!(original.to_vec(), decoded);
    }

    #[tokio::test]
    async fn test_captcha_store() {
        let store = CaptchaStore::new();
        let job_id = Uuid::new_v4();
        
        store.store_solution(job_id, "ABC123".to_string()).await;
        assert!(store.has_solution(job_id).await);
        
        let solution = store.take_solution(job_id).await;
        assert_eq!(solution, Some("ABC123".to_string()));
        assert!(!store.has_solution(job_id).await);
    }
}
