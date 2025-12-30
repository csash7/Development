//! Data models for the scraper

use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// =============================================================================
// Land Record Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LandRecord {
    pub id: Uuid,
    pub state_code: String,
    pub survey_number: String,
    pub sub_division: Option<String>,
    pub district_code: String,
    pub mandal_code: String,
    pub village_code: String,
    pub khata_number: Option<String>,
    pub patta_number: Option<String>,
    pub extent_acres: Option<rust_decimal::Decimal>,
    pub extent_guntas: Option<rust_decimal::Decimal>,
    pub extent_cents: Option<rust_decimal::Decimal>,
    pub land_classification: Option<String>,
    pub land_nature: Option<String>,
    pub water_source: Option<String>,
    pub coordinates_lat: Option<rust_decimal::Decimal>,
    pub coordinates_lng: Option<rust_decimal::Decimal>,
    pub status: Option<String>,
    pub raw_html: Option<String>,
    pub source_url: Option<String>,
    pub scraped_at: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LandOwner {
    pub id: Uuid,
    pub land_record_id: Uuid,
    pub name: String,
    pub name_telugu: Option<String>,
    pub father_name: Option<String>,
    pub aadhaar_last4: Option<String>,
    pub share_percentage: Option<rust_decimal::Decimal>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LandRecordWithOwners {
    #[serde(flatten)]
    pub record: LandRecord,
    pub owners: Vec<LandOwner>,
    pub district_name: Option<String>,
    pub mandal_name: Option<String>,
    pub village_name: Option<String>,
}

// =============================================================================
// Encumbrance Certificate Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EncumbranceCert {
    pub id: Uuid,
    pub land_record_id: Option<Uuid>,
    pub document_number: Option<String>,
    pub sro_name: Option<String>,
    pub from_date: Option<NaiveDate>,
    pub to_date: Option<NaiveDate>,
    pub status: Option<String>,
    pub encumbrances: Option<serde_json::Value>,
    pub raw_html: Option<String>,
    pub source_url: Option<String>,
    pub scraped_at: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
}

// =============================================================================
// Scrape Job Models
// =============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text", rename_all = "snake_case")]
pub enum JobType {
    Meebhoomi1b,
    MeebhoomiAdangal,
    IgrsEc,
}

impl std::fmt::Display for JobType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            JobType::Meebhoomi1b => write!(f, "meebhoomi_1b"),
            JobType::MeebhoomiAdangal => write!(f, "meebhoomi_adangal"),
            JobType::IgrsEc => write!(f, "igrs_ec"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "text", rename_all = "snake_case")]
pub enum JobStatus {
    Pending,
    Running,
    Completed,
    Failed,
    CaptchaRequired,
}

impl std::fmt::Display for JobStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            JobStatus::Pending => write!(f, "pending"),
            JobStatus::Running => write!(f, "running"),
            JobStatus::Completed => write!(f, "completed"),
            JobStatus::Failed => write!(f, "failed"),
            JobStatus::CaptchaRequired => write!(f, "captcha_required"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ScrapeJob {
    pub id: Uuid,
    pub state_code: Option<String>,
    pub job_type: String,
    pub status: String,
    pub district_code: Option<String>,
    pub mandal_code: Option<String>,
    pub village_code: Option<String>,
    pub survey_number: Option<String>,
    pub search_type: Option<String>,
    pub search_value: Option<String>,
    pub priority: Option<i32>,
    pub attempts: Option<i32>,
    pub max_attempts: Option<i32>,
    pub error_message: Option<String>,
    pub captcha_image_base64: Option<String>,
    pub result_record_id: Option<Uuid>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJobRequest {
    pub state_code: String,
    pub job_type: String,
    pub district_code: String,
    pub mandal_code: String,
    pub village_code: String,
    pub survey_number: Option<String>,
    pub search_type: Option<String>,
    pub search_value: Option<String>,
    pub priority: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitCaptchaRequest {
    pub solution: String,
}

// =============================================================================
// Scrape Log Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ScrapeLog {
    pub id: Uuid,
    pub job_id: Option<Uuid>,
    pub level: String,
    pub message: String,
    pub metadata: Option<serde_json::Value>,
    pub created_at: Option<DateTime<Utc>>,
}

// =============================================================================
// Location Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct District {
    pub code: String,
    pub name: String,
    pub state_code: Option<String>,
    pub name_telugu: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Mandal {
    pub code: String,
    pub name: String,
    pub name_telugu: Option<String>,
    pub district_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Village {
    pub code: String,
    pub name: String,
    pub name_telugu: Option<String>,
    pub mandal_code: Option<String>,
}

// =============================================================================
// Stats Models
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScraperStats {
    pub total_records: i64,
    pub total_jobs: i64,
    pub pending_jobs: i64,
    pub running_jobs: i64,
    pub completed_jobs: i64,
    pub failed_jobs: i64,
    pub captcha_waiting_jobs: i64,
    pub success_rate: f64,
}

// =============================================================================
// Query Parameters
// =============================================================================

#[derive(Debug, Clone, Deserialize)]
pub struct RecordQuery {
    pub state: Option<String>,
    pub district: Option<String>,
    pub mandal: Option<String>,
    pub village: Option<String>,
    pub survey: Option<String>,
    pub owner: Option<String>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JobQuery {
    pub status: Option<String>,
    pub job_type: Option<String>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct LogQuery {
    pub job_id: Option<Uuid>,
    pub level: Option<String>,
    pub page: Option<i32>,
    pub limit: Option<i32>,
}
