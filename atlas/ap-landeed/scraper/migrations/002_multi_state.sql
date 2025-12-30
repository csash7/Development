-- Migration: 002_multi_state.sql
-- Add support for multi-state architecture (Telangana pivot)

-- Add state_code to tables
ALTER TABLE districts ADD COLUMN state_code VARCHAR(10) DEFAULT 'AP';
ALTER TABLE land_records ADD COLUMN state_code VARCHAR(10) DEFAULT 'AP';
ALTER TABLE scrape_jobs ADD COLUMN state_code VARCHAR(10) DEFAULT 'AP';

-- Update existing AP districts
UPDATE districts SET state_code = 'AP';

-- Insert Telangana Districts
INSERT INTO districts (code, name, state_code) VALUES
('19', 'Adilabad', 'TS'),
('20', 'Bhadradri Kothagudem', 'TS'),
('21', 'Hanamkonda', 'TS'),
('16', 'Hyderabad', 'TS'),
('22', 'Jagtial', 'TS'),
('23', 'Jangaon', 'TS'),
('24', 'Jayashankar Bhupalpally', 'TS'),
('25', 'Jogulamba Gadwal', 'TS'),
('26', 'Kamareddy', 'TS'),
('14', 'Karimnagar', 'TS'),
('27', 'Khammam', 'TS'),
('28', 'Komaram Bheem Asifabad', 'TS'),
('29', 'Mahabubabad', 'TS'),
('17', 'Mahabubnagar', 'TS'),
('30', 'Mancherial', 'TS'),
('15', 'Medak', 'TS'),
('31', 'Medchal-Malkajgiri', 'TS'),
('35', 'Mulugu', 'TS'),
('32', 'Nagarkurnool', 'TS'),
('12', 'Nalgonda', 'TS'),
('37', 'Narayanpet', 'TS'),
('33', 'Nirmal', 'TS'),
('18', 'Nizamabad', 'TS'),
('34', 'Peddapalli', 'TS'),
('36', 'Rajanna Sircilla', 'TS'),
('13', 'Rangareddy', 'TS'),
('38', 'Sangareddy', 'TS'),
('39', 'Siddipet', 'TS'),
('40', 'Suryapet', 'TS'),
('41', 'Vikarabad', 'TS'),
('42', 'Wanaparthy', 'TS'),
('11', 'Warangal', 'TS'),
('43', 'Yadadri Bhuvanagiri', 'TS');

-- Update indexes
CREATE INDEX idx_land_records_state ON land_records(state_code);
CREATE INDEX idx_scrape_jobs_state ON scrape_jobs(state_code);
CREATE INDEX idx_districts_state ON districts(state_code);
