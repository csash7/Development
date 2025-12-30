use std::time::Duration;
use sqlx::PgPool;
use uuid::Uuid;
use crate::{db, models::{JobQuery, ScrapeJob, LandRecord, LandOwner}, error::AppError};
use crate::scraper::{self, meebhoomi::ScrapedLandRecord};

pub async fn run_worker(pool: PgPool) {
    tracing::info!("Scrape worker started");

    loop {
        if let Err(e) = process_pending_jobs(&pool).await {
            tracing::error!("Error in worker loop: {}", e);
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn process_pending_jobs(pool: &PgPool) -> Result<(), AppError> {
    // Fetch pending jobs
    let jobs = db::get_jobs(pool, &JobQuery {
        status: Some("pending".to_string()),
        job_type: None,
        page: Some(1),
        limit: Some(10), // Process batch of 10
    }).await?;

    if jobs.is_empty() {
        return Ok(());
    }

    tracing::info!("Found {} pending jobs", jobs.len());

    let browser_result = scraper::browser::launch_browser(None).await;
    if let Err(e) = browser_result {
        tracing::error!("Failed to launch browser: {}", e);
        return Err(e);
    }
    let (browser, _handle) = browser_result.unwrap();

    for job in jobs {
        process_job(pool, &browser, job).await?;
    }

    Ok(())
}

async fn process_job(
    pool: &PgPool,
    browser: &chromiumoxide::Browser,
    job: ScrapeJob,
) -> Result<(), AppError> {
    tracing::info!("Processing job {} ({})", job.id, job.job_type);
    
    // Update status to running
    db::update_job_status(pool, job.id, "running", None).await?;

    let page = scraper::browser::new_page(browser).await?;
    
    let result = match job.job_type.as_str() {
        "telangana_land_status" => {
             scraper::telangana::scrape_by_survey_no(
                &page,
                job.district_code.as_deref().unwrap_or(""),
                job.mandal_code.as_deref().unwrap_or(""),
                job.village_code.as_deref().unwrap_or(""),
                job.survey_number.as_deref().unwrap_or(""),
                None // No captcha solver yet
             ).await
        },
        "meebhoomi_1b" => {
            scraper::meebhoomi::scrape_1b(
                &page,
                job.district_code.as_deref().unwrap_or(""),
                job.mandal_code.as_deref().unwrap_or(""),
                job.village_code.as_deref().unwrap_or(""),
                job.survey_number.as_deref().unwrap_or(""),
                None // No manual captcha solution initially
            ).await
        },
        // Add other types...
        _ => Err(AppError::InvalidInput(format!("Unknown job type: {}", job.job_type))),
    };

    match result {
        Ok(scraped_record) => {
            // Save to DB
            let record = LandRecord {
                id: Uuid::new_v4(), // DB will generate, but struct needs it? No, struct has it.
                // Wait, insert_land_record doesn't take ID, returns it.
                // But LandRecord struct has ID field. I need a "NewLandRecord" struct or fill dummy.
                // Using dummy ID since insert ignores it (or I modified insert to ignore it? I used VALUES ($1...)).
                // My insert query VALUES list (13 params) matches fields properly.
                state_code: job.state_code.clone().unwrap_or_else(|| "AP".to_string()),
                survey_number: scraped_record.survey_number,
                sub_division: scraped_record.sub_division,
                district_code: scraped_record.district_code,
                mandal_code: scraped_record.mandal_code,
                village_code: scraped_record.village_code,
                khata_number: scraped_record.khata_number,
                patta_number: scraped_record.patta_number,
                extent_acres: scraped_record.extent_acres.map(|f| rust_decimal::Decimal::from_f64_retain(f).unwrap_or_default()),
                extent_guntas: scraped_record.extent_guntas.map(|f| rust_decimal::Decimal::from_f64_retain(f).unwrap_or_default()),
                extent_cents: scraped_record.extent_cents.map(|f| rust_decimal::Decimal::from_f64_retain(f).unwrap_or_default()),
                land_classification: scraped_record.land_classification,
                land_nature: scraped_record.land_nature,
                water_source: scraped_record.water_source,
                coordinates_lat: None,
                coordinates_lng: None,
                status: Some("active".to_string()),
                raw_html: Some(scraped_record.raw_html),
                source_url: Some(scraped_record.source_url),
                scraped_at: Some(chrono::Utc::now()),
                created_at: None,
                updated_at: None,
            };

            let record_id = db::insert_land_record(pool, &record).await?;
            
            // Convert owners
            let owners: Vec<LandOwner> = scraped_record.owners.into_iter().map(|o| LandOwner {
                id: Uuid::new_v4(),
                land_record_id: record_id,
                name: o.name,
                name_telugu: o.name_telugu,
                father_name: o.father_name,
                aadhaar_last4: None,
                share_percentage: o.share_percentage.map(|f| rust_decimal::Decimal::from_f64_retain(f).unwrap_or_default()),
                created_at: None,
            }).collect();

            db::insert_land_owners(pool, record_id, &owners).await?;

            db::update_job_status(pool, job.id, "completed", None).await?;
            Ok(())
        },
        Err(e) => {
            // Check for CAPTCHA required
            if e.to_string().contains("CAPTCHA_REQUIRED") {
                let parts: Vec<&str> = e.to_string().split(':').collect();
                if parts.len() > 1 {
                    let image_base64 = parts[1];
                    db::update_job_captcha(pool, job.id, image_base64).await?;
                    return Ok(());
                }
            }
            
            db::update_job_status(pool, job.id, "failed", Some(&e.to_string())).await?;
            Err(e)
        }
    }
}
