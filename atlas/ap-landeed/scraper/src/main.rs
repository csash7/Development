//! AP Landeed Scraper - Main Entry Point
//! 
//! A headless scraper for AP government land records (Meebhoomi, IGRS).

mod api;
mod db;
mod models;
mod scraper;
mod error;
mod sms_activate;
mod worker;

use std::net::SocketAddr;
use axum::{
    Router,
    routing::{get, post, delete},
    http::Method,
};
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();
    
    // Initialize logging
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "info,ap_landeed_scraper=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting AP Landeed Scraper...");

    // Database connection
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://landeed:landeed_secret@localhost:5432/ap_landeed".to_string());
    
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await?;
    
    tracing::info!("Connected to PostgreSQL");

    // Spawn background worker
    let worker_pool = pool.clone();
    tokio::spawn(async move {
        worker::run_worker(worker_pool).await;
    });

    // Build application state
    let state = api::AppState::new(pool);

    // CORS configuration
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::DELETE, Method::OPTIONS])
        .allow_headers(Any);

    // Build routes
    let app = Router::new()
        // Health check
        .route("/api/health", get(api::health_check))
        
        // Land records
        .route("/api/records", get(api::list_records))
        .route("/api/records/:id", get(api::get_record))
        
        // Scrape jobs
        .route("/api/jobs", get(api::list_jobs))
        .route("/api/jobs", post(api::create_job))
        .route("/api/jobs/:id", get(api::get_job))
        .route("/api/jobs/:id", delete(api::cancel_job))
        .route("/api/jobs/:id/captcha", post(api::submit_captcha))
        
        // Logs
        .route("/api/logs", get(api::list_logs))
        
        // Stats
        .route("/api/stats", get(api::get_stats))
        
        // Districts/Mandals/Villages
        .route("/api/districts", get(api::list_districts))
        .route("/api/mandals/:district", get(api::list_mandals))
        .route("/api/villages/:mandal", get(api::list_villages))
        
        .layer(cors)
        .with_state(state);

    // Start server
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap_or(8080);
    
    let addr = format!("{}:{}", host, port).parse::<SocketAddr>()?;
    tracing::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
