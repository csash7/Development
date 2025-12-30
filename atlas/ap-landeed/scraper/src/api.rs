//! API handlers for the scraper service

use axum::{
    extract::{Path, Query, State},
    Json,
};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::db;
use crate::error::AppError;
use crate::models::*;

// =============================================================================
// Application State
// =============================================================================

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
}

impl AppState {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

// =============================================================================
// Health Check
// =============================================================================

pub async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "healthy",
        "service": "ap-landeed-scraper",
        "version": env!("CARGO_PKG_VERSION")
    }))
}

// =============================================================================
// Land Records
// =============================================================================

pub async fn list_records(
    State(state): State<AppState>,
    Query(query): Query<RecordQuery>,
) -> Result<Json<Vec<LandRecord>>, AppError> {
    let records = db::get_records(&state.pool, &query).await?;
    Ok(Json(records))
}

pub async fn get_record(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<LandRecordWithOwners>, AppError> {
    let record = db::get_record_by_id(&state.pool, id).await?;
    let owners = db::get_owners_for_record(&state.pool, id).await?;
    
    // Get location names
    let districts = db::get_districts(&state.pool, None).await?;
    let district_name = districts.iter()
        .find(|d| d.code == record.district_code)
        .map(|d| d.name.clone());
    
    let mandals = db::get_mandals(&state.pool, &record.district_code).await?;
    let mandal_name = mandals.iter()
        .find(|m| m.code == record.mandal_code)
        .map(|m| m.name.clone());
    
    let villages = db::get_villages(&state.pool, &record.mandal_code).await?;
    let village_name = villages.iter()
        .find(|v| v.code == record.village_code)
        .map(|v| v.name.clone());

    Ok(Json(LandRecordWithOwners {
        record,
        owners,
        district_name,
        mandal_name,
        village_name,
    }))
}

// =============================================================================
// Scrape Jobs
// =============================================================================

pub async fn list_jobs(
    State(state): State<AppState>,
    Query(query): Query<JobQuery>,
) -> Result<Json<Vec<ScrapeJob>>, AppError> {
    let jobs = db::get_jobs(&state.pool, &query).await?;
    Ok(Json(jobs))
}

pub async fn get_job(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ScrapeJob>, AppError> {
    let job = db::get_job_by_id(&state.pool, id).await?;
    Ok(Json(job))
}

pub async fn create_job(
    State(state): State<AppState>,
    Json(req): Json<CreateJobRequest>,
) -> Result<Json<ScrapeJob>, AppError> {
    // Validate job type
    // Validate job type
    let valid_types = [
        "meebhoomi_1b", 
        "meebhoomi_adangal", 
        "igrs_ec",
        "telangana_land_status"
    ];
    if !valid_types.contains(&req.job_type.as_str()) {
        return Err(AppError::InvalidInput(format!(
            "Invalid job type. Must be one of: {:?}",
            valid_types
        )));
    }

    let job = db::create_job(&state.pool, &req).await?;
    
    // Log job creation
    db::create_log(
        &state.pool,
        Some(job.id),
        "info",
        &format!("Job created: {} for survey {}", req.job_type, req.survey_number.as_deref().unwrap_or("N/A")),
        None,
    ).await?;

    tracing::info!(
        job_id = %job.id,
        job_type = %req.job_type,
        district = %req.district_code,
        "Scrape job created"
    );

    Ok(Json(job))
}

pub async fn cancel_job(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, AppError> {
    db::cancel_job(&state.pool, id).await?;
    
    db::create_log(
        &state.pool,
        Some(id),
        "warn",
        "Job cancelled by user",
        None,
    ).await?;

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Job cancelled"
    })))
}

pub async fn submit_captcha(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<SubmitCaptchaRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let job = db::get_job_by_id(&state.pool, id).await?;
    
    if job.status != "captcha_required" {
        return Err(AppError::InvalidInput(
            "Job is not waiting for CAPTCHA".to_string()
        ));
    }

    // Update job status back to pending so the scraper picks it up
    db::update_job_status(&state.pool, id, "pending", None).await?;
    
    // Log CAPTCHA submission
    db::create_log(
        &state.pool,
        Some(id),
        "info",
        &format!("CAPTCHA solution submitted: {}", req.solution),
        Some(serde_json::json!({ "captcha_length": req.solution.len() })),
    ).await?;

    // TODO: Store the CAPTCHA solution temporarily for the scraper to use
    // For now, we'll need to implement a Redis-based solution queue

    Ok(Json(serde_json::json!({
        "success": true,
        "message": "CAPTCHA submitted, job will resume"
    })))
}

// =============================================================================
// Logs
// =============================================================================

pub async fn list_logs(
    State(state): State<AppState>,
    Query(query): Query<LogQuery>,
) -> Result<Json<Vec<ScrapeLog>>, AppError> {
    let logs = db::get_logs(&state.pool, &query).await?;
    Ok(Json(logs))
}

// =============================================================================
// Statistics
// =============================================================================

pub async fn get_stats(
    State(state): State<AppState>,
) -> Result<Json<ScraperStats>, AppError> {
    let stats = db::get_stats(&state.pool).await?;
    Ok(Json(stats))
}

// =============================================================================
// Location Data
// =============================================================================

#[derive(Deserialize)]
pub struct DistrictQuery {
    state: Option<String>,
}

pub async fn list_districts(
    State(state): State<AppState>,
    Query(query): Query<DistrictQuery>,
) -> Result<Json<Vec<District>>, AppError> {
    let districts = db::get_districts(&state.pool, query.state.as_deref()).await?;
    Ok(Json(districts))
}

pub async fn list_mandals(
    State(state): State<AppState>,
    Path(district): Path<String>,
) -> Result<Json<Vec<Mandal>>, AppError> {
    let mandals = db::get_mandals(&state.pool, &district).await?;
    Ok(Json(mandals))
}

pub async fn list_villages(
    State(state): State<AppState>,
    Path(mandal): Path<String>,
) -> Result<Json<Vec<Village>>, AppError> {
    let villages = db::get_villages(&state.pool, &mandal).await?;
    Ok(Json(villages))
}
