-- AP Landeed Database Schema
-- Migration: 001_initial.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Districts lookup table
CREATE TABLE districts (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_telugu VARCHAR(100)
);

-- Mandals lookup table
CREATE TABLE mandals (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_telugu VARCHAR(100),
    district_code VARCHAR(10) REFERENCES districts(code)
);

-- Villages lookup table
CREATE TABLE villages (
    code VARCHAR(30) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_telugu VARCHAR(100),
    mandal_code VARCHAR(20) REFERENCES mandals(code)
);

-- Land Records Table (scraped data)
CREATE TABLE land_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_number VARCHAR(50) NOT NULL,
    sub_division VARCHAR(20),
    district_code VARCHAR(10) NOT NULL REFERENCES districts(code),
    mandal_code VARCHAR(20) NOT NULL REFERENCES mandals(code),
    village_code VARCHAR(30) NOT NULL REFERENCES villages(code),
    khata_number VARCHAR(50),
    patta_number VARCHAR(50),
    extent_acres DECIMAL(10,2),
    extent_guntas DECIMAL(10,2),
    extent_cents DECIMAL(10,2),
    land_classification VARCHAR(100),
    land_nature VARCHAR(100),
    water_source VARCHAR(100),
    coordinates_lat DECIMAL(10,6),
    coordinates_lng DECIMAL(10,6),
    status VARCHAR(20) DEFAULT 'active',
    raw_html TEXT,
    source_url TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(district_code, mandal_code, village_code, survey_number, sub_division)
);

-- Land Owners Table
CREATE TABLE land_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    land_record_id UUID NOT NULL REFERENCES land_records(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_telugu VARCHAR(255),
    father_name VARCHAR(255),
    aadhaar_last4 VARCHAR(4),
    share_percentage DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encumbrance Certificates Table
CREATE TABLE encumbrance_certs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    land_record_id UUID REFERENCES land_records(id),
    document_number VARCHAR(100),
    sro_name VARCHAR(255),
    from_date DATE,
    to_date DATE,
    status VARCHAR(20), -- 'clear' or 'encumbered'
    encumbrances JSONB DEFAULT '[]',
    raw_html TEXT,
    source_url TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape Jobs Table (job queue)
CREATE TABLE scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'meebhoomi_1b', 'meebhoomi_adangal', 'igrs_ec'
    status VARCHAR(20) DEFAULT 'pending', -- pending, running, completed, failed, captcha_required
    district_code VARCHAR(10),
    mandal_code VARCHAR(20),
    village_code VARCHAR(30),
    survey_number VARCHAR(50),
    search_type VARCHAR(20), -- 'survey_number', 'khata_number', 'aadhaar'
    search_value VARCHAR(100),
    priority INT DEFAULT 0,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    captcha_image_base64 TEXT, -- For manual CAPTCHA solving
    result_record_id UUID REFERENCES land_records(id),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scrape Logs Table (detailed logging)
CREATE TABLE scrape_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL, -- debug, info, warn, error
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_land_records_location ON land_records(district_code, mandal_code, village_code);
CREATE INDEX idx_land_records_survey ON land_records(survey_number);
CREATE INDEX idx_land_records_khata ON land_records(khata_number);
CREATE INDEX idx_land_records_status ON land_records(status);
CREATE INDEX idx_land_records_scraped_at ON land_records(scraped_at DESC);

CREATE INDEX idx_land_owners_record ON land_owners(land_record_id);
CREATE INDEX idx_land_owners_name ON land_owners(name);

CREATE INDEX idx_encumbrance_certs_record ON encumbrance_certs(land_record_id);
CREATE INDEX idx_encumbrance_certs_doc ON encumbrance_certs(document_number);

CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);
CREATE INDEX idx_scrape_jobs_type ON scrape_jobs(job_type);
CREATE INDEX idx_scrape_jobs_created ON scrape_jobs(created_at DESC);

CREATE INDEX idx_scrape_logs_job ON scrape_logs(job_id);
CREATE INDEX idx_scrape_logs_level ON scrape_logs(level);
CREATE INDEX idx_scrape_logs_created ON scrape_logs(created_at DESC);

-- Insert initial district data for Andhra Pradesh
INSERT INTO districts (code, name, name_telugu) VALUES
    ('VSK', 'Visakhapatnam', 'విశాఖపట్నం'),
    ('GNT', 'Guntur', 'గుంటూరు'),
    ('KRS', 'Krishna', 'కృష్ణా'),
    ('EGD', 'East Godavari', 'తూర్పు గోదావరి'),
    ('WGD', 'West Godavari', 'పశ్చిమ గోదావరి'),
    ('CTR', 'Chittoor', 'చిత్తూరు'),
    ('NLR', 'Nellore', 'నెల్లూరు'),
    ('ATP', 'Anantapur', 'అనంతపురం'),
    ('KNL', 'Kurnool', 'కర్నూలు'),
    ('YSR', 'YSR Kadapa', 'వైఎస్ఆర్ కడప'),
    ('PKM', 'Prakasam', 'ప్రకాశం'),
    ('SKL', 'Srikakulam', 'శ్రీకాకుళం'),
    ('VZN', 'Vizianagaram', 'విజయనగరం');

-- Insert sample mandals
INSERT INTO mandals (code, name, name_telugu, district_code) VALUES
    ('VSK04', 'Madhurawada', 'మధురవాడ', 'VSK'),
    ('GNT03', 'Mangalagiri', 'మంగళగిరి', 'GNT'),
    ('KRS01', 'Vijayawada Urban', 'విజయవాడ అర్బన్', 'KRS'),
    ('EGD02', 'Rajahmundry Urban', 'రాజమండ్రి అర్బన్', 'EGD'),
    ('CTR01', 'Tirupati Urban', 'తిరుపతి అర్బన్', 'CTR'),
    ('NLR02', 'Kavali', 'కావలి', 'NLR'),
    ('YSR01', 'Kadapa Urban', 'కడప అర్బన్', 'YSR'),
    ('KNL02', 'Nandyal', 'నంద్యాల', 'KNL');

-- Insert sample villages
INSERT INTO villages (code, name, name_telugu, mandal_code) VALUES
    ('VSK04R01', 'Rushikonda', 'ఋషికొండ', 'VSK04'),
    ('GNT03N01', 'Neerukonda', 'నీరుకొండ', 'GNT03'),
    ('KRS01B01', 'Benz Circle', 'బెంజ్ సర్కిల్', 'KRS01'),
    ('EGD02D01', 'Dowleswaram', 'దౌలేశ్వరం', 'EGD02'),
    ('CTR01T01', 'Tirumala Foot Hills', 'తిరుమల పాదాల వద్ద', 'CTR01'),
    ('NLR02M01', 'Mypadu Beach', 'మైపాడు బీచ్', 'NLR02'),
    ('YSR01K01', 'Kadapa Town', 'కడప టౌన్', 'YSR01'),
    ('KNL02N01', 'Nandyal Town', 'నంద్యాల టౌన్', 'KNL02');
