//! Database operations for the scraper

use sqlx::{PgPool, Row};
use uuid::Uuid;
use crate::models::*;
use crate::error::AppError;

// =============================================================================
// Land Records
// =============================================================================

pub async fn get_records(
    pool: &PgPool,
    query: &RecordQuery,
) -> Result<Vec<LandRecord>, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    let mut sql = String::from(
        "SELECT * FROM land_records WHERE 1=1"
    );
    
    if query.district.is_some() {
        sql.push_str(" AND district_code = $1");
    }
    if query.mandal.is_some() {
        sql.push_str(" AND mandal_code = $2");
    }
    if query.village.is_some() {
        sql.push_str(" AND village_code = $3");
    }
    if query.survey.is_some() {
        sql.push_str(" AND survey_number ILIKE $4");
    }
    
    if query.state.is_some() {
        sql.push_str(" AND state_code = $6");
    }
    
    sql.push_str(" ORDER BY created_at DESC LIMIT $7 OFFSET $8");

    let records = sqlx::query_as::<_, LandRecord>(&sql)
        .bind(&query.district)
        .bind(&query.mandal)
        .bind(&query.village)
        .bind(query.survey.as_ref().map(|s| format!("%{}%", s)))
        .bind(limit)
        .bind(offset)
        .bind(&query.state)
        .fetch_all(pool)
        .await?;

    Ok(records)
}

pub async fn get_record_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<LandRecord, AppError> {
    let record = sqlx::query_as::<_, LandRecord>(
        "SELECT * FROM land_records WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Record {} not found", id)))?;

    Ok(record)
}

pub async fn get_owners_for_record(
    pool: &PgPool,
    record_id: Uuid,
) -> Result<Vec<LandOwner>, AppError> {
    let owners = sqlx::query_as::<_, LandOwner>(
        "SELECT * FROM land_owners WHERE land_record_id = $1"
    )
    .bind(record_id)
    .fetch_all(pool)
    .await?;

    Ok(owners)
}

// =============================================================================
// Scrape Jobs
// =============================================================================

pub async fn get_jobs(
    pool: &PgPool,
    query: &JobQuery,
) -> Result<Vec<ScrapeJob>, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(20).min(100);
    let offset = (page - 1) * limit;

    let jobs = sqlx::query_as::<_, ScrapeJob>(
        r#"
        SELECT * FROM scrape_jobs 
        WHERE ($1::text IS NULL OR status = $1)
          AND ($2::text IS NULL OR job_type = $2)
        ORDER BY 
            CASE status 
                WHEN 'captcha_required' THEN 0
                WHEN 'running' THEN 1 
                WHEN 'pending' THEN 2
                ELSE 3 
            END,
            created_at DESC
        LIMIT $3 OFFSET $4
        "#
    )
    .bind(&query.status)
    .bind(&query.job_type)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok(jobs)
}

pub async fn get_job_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<ScrapeJob, AppError> {
    let job = sqlx::query_as::<_, ScrapeJob>(
        "SELECT * FROM scrape_jobs WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Job {} not found", id)))?;

    Ok(job)
}

pub async fn create_job(
    pool: &PgPool,
    req: &CreateJobRequest,
) -> Result<ScrapeJob, AppError> {
    let job = sqlx::query_as::<_, ScrapeJob>(
        r#"
        INSERT INTO scrape_jobs (
            state_code, job_type, status, district_code, mandal_code, village_code,
            survey_number, search_type, search_value, priority
        )
        VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#
    )
    .bind(&req.state_code)
    .bind(&req.job_type)
    .bind(&req.district_code)
    .bind(&req.mandal_code)
    .bind(&req.village_code)
    .bind(&req.survey_number)
    .bind(&req.search_type)
    .bind(&req.search_value)
    .bind(req.priority.unwrap_or(0))
    .fetch_one(pool)
    .await?;

    Ok(job)
}

pub async fn update_job_status(
    pool: &PgPool,
    id: Uuid,
    status: &str,
    error_message: Option<&str>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        UPDATE scrape_jobs 
        SET status = $2, error_message = $3, updated_at = NOW()
        WHERE id = $1
        "#
    )
    .bind(id)
    .bind(status)
    .bind(error_message)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn update_job_captcha(
    pool: &PgPool,
    id: Uuid,
    captcha_image: &str,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        UPDATE scrape_jobs 
        SET status = 'captcha_required', captcha_image_base64 = $2
        WHERE id = $1
        "#
    )
    .bind(id)
    .bind(captcha_image)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn cancel_job(
    pool: &PgPool,
    id: Uuid,
) -> Result<(), AppError> {
    let result = sqlx::query(
        r#"
        UPDATE scrape_jobs 
        SET status = 'failed', error_message = 'Cancelled by user'
        WHERE id = $1 AND status IN ('pending', 'captcha_required')
        "#
    )
    .bind(id)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::InvalidInput("Cannot cancel this job".to_string()));
    }

    Ok(())
}

// =============================================================================
// Scrape Logs
// =============================================================================

pub async fn get_logs(
    pool: &PgPool,
    query: &LogQuery,
) -> Result<Vec<ScrapeLog>, AppError> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(50).min(200);
    let offset = (page - 1) * limit;

    let logs = sqlx::query_as::<_, ScrapeLog>(
        r#"
        SELECT * FROM scrape_logs 
        WHERE ($1::uuid IS NULL OR job_id = $1)
          AND ($2::text IS NULL OR level = $2)
        ORDER BY created_at DESC
        LIMIT $3 OFFSET $4
        "#
    )
    .bind(query.job_id)
    .bind(&query.level)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;

    Ok(logs)
}

pub async fn create_log(
    pool: &PgPool,
    job_id: Option<Uuid>,
    level: &str,
    message: &str,
    metadata: Option<serde_json::Value>,
) -> Result<(), AppError> {
    sqlx::query(
        r#"
        INSERT INTO scrape_logs (job_id, level, message, metadata)
        VALUES ($1, $2, $3, $4)
        "#
    )
    .bind(job_id)
    .bind(level)
    .bind(message)
    .bind(metadata)
    .execute(pool)
    .await?;

    Ok(())
}

// =============================================================================
// Location Data
// =============================================================================

pub async fn get_districts(pool: &PgPool, state_code: Option<&str>) -> Result<Vec<District>, AppError> {
    let mut sql = String::from("SELECT * FROM districts");
    
    if let Some(state) = state_code {
        sql.push_str(" WHERE state_code = $1");
    }
    
    sql.push_str(" ORDER BY name");

    let query = sqlx::query_as::<_, District>(&sql);
    
    let query = if let Some(state) = state_code {
        query.bind(state)
    } else {
        query
    };

    let districts = query
        .fetch_all(pool)
        .await?;

    Ok(districts)
}

pub async fn get_mandals(
    pool: &PgPool,
    district_code: &str,
) -> Result<Vec<Mandal>, AppError> {
    let mandals = sqlx::query_as::<_, Mandal>(
        "SELECT * FROM mandals WHERE district_code = $1 ORDER BY name"
    )
    .bind(district_code)
    .fetch_all(pool)
    .await?;

    Ok(mandals)
}

pub async fn get_villages(
    pool: &PgPool,
    mandal_code: &str,
) -> Result<Vec<Village>, AppError> {
    let villages = sqlx::query_as::<_, Village>(
        "SELECT * FROM villages WHERE mandal_code = $1 ORDER BY name"
    )
    .bind(mandal_code)
    .fetch_all(pool)
    .await?;

    Ok(villages)
}

// =============================================================================
// Statistics
// =============================================================================

pub async fn get_stats(pool: &PgPool) -> Result<ScraperStats, AppError> {
    let record_count: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM land_records"
    )
    .fetch_one(pool)
    .await?;

    let job_counts = sqlx::query(
        r#"
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'running') as running,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status = 'failed') as failed,
            COUNT(*) FILTER (WHERE status = 'captcha_required') as captcha
        FROM scrape_jobs
        "#
    )
    .fetch_one(pool)
    .await?;

    let total: i64 = job_counts.get("total");
    let completed: i64 = job_counts.get("completed");
    let failed: i64 = job_counts.get("failed");
    
    let success_rate = if completed + failed > 0 {
        completed as f64 / (completed + failed) as f64 * 100.0
    } else {
        0.0
    };

    Ok(ScraperStats {
        total_records: record_count,
        total_jobs: total,
        pending_jobs: job_counts.get("pending"),
        running_jobs: job_counts.get("running"),
        completed_jobs: completed,
        failed_jobs: failed,
        captcha_waiting_jobs: job_counts.get("captcha"),
        success_rate,
    })
}

// =============================================================================
// Record Insertion
// =============================================================================

pub async fn insert_land_record(
    pool: &PgPool,
    record: &LandRecord,
) -> Result<Uuid, AppError> {
    let row: (Uuid,) = sqlx::query_as(
        r#"
        INSERT INTO land_records (
            state_code, sub_division, district_code, mandal_code, village_code,
            survey_number, land_classification, land_nature,
            extent_acres, extent_guntas, extent_cents,
            source_url, raw_html, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
        ON CONFLICT (district_code, mandal_code, village_code, survey_number, sub_division)
        DO UPDATE SET
            extent_acres = EXCLUDED.extent_acres,
            extent_guntas = EXCLUDED.extent_guntas,
            extent_cents = EXCLUDED.extent_cents,
            raw_html = EXCLUDED.raw_html,
            updated_at = NOW()
        RETURNING id
        "#
    )
    .bind(&record.state_code)
    .bind(&record.sub_division)
    .bind(&record.district_code)
    .bind(&record.mandal_code)
    .bind(&record.village_code)
    .bind(&record.survey_number)
    .bind(&record.land_classification)
    .bind(&record.land_nature)
    .bind(&record.extent_acres)
    .bind(&record.extent_guntas)
    .bind(&record.extent_cents)
    .bind(&record.source_url)
    .bind(&record.raw_html)
    .fetch_one(pool)
    .await?;

    Ok(row.0)
}

pub async fn insert_land_owners(
    pool: &PgPool,
    record_id: Uuid,
    owners: &[LandOwner],
) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;

    sqlx::query("DELETE FROM land_owners WHERE land_record_id = $1")
        .bind(record_id)
        .execute(&mut *tx)
        .await?;

    for owner in owners {
        sqlx::query(
            r#"
            INSERT INTO land_owners (land_record_id, name, father_name, share_percentage)
            VALUES ($1, $2, $3, $4)
            "#
        )
        .bind(record_id)
        .bind(&owner.name)
        .bind(&owner.father_name)
        .bind(&owner.share_percentage)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;
    Ok(())
}
