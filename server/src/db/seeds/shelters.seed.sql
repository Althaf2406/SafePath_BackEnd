-- SafePath — Surabaya shelter seed data matching the new schema
-- Run: psql -d safepath_db -f shelters.seed.sql

INSERT INTO shelters (name, address, latitude, longitude, capacity, facilities, shelter_type, disaster_type_supported, is_open_area, building_level, is_active) VALUES

-- 1. Universitas Airlangga Kampus C Evacuation Hall
('Universitas Airlangga Kampus C',
 'Mulyorejo, Surabaya',
 -7.2677, 112.7847,
 800, ARRAY['Toilet', 'Air Bersih', 'Area Parkir'],
 'building', ARRAY['flood', 'earthquake'],
 false, 3, true),

-- 2. GOR Bung Tomo
('GOR Bung Tomo',
 'Benowo, Surabaya',
 -7.2239, 112.6081,
 1200, ARRAY['Toilet', 'Area Luas', 'Parkir'],
 'open_area', ARRAY['earthquake'],
 true, 1, true),

-- 3. Balai Pemuda Surabaya
('Balai Pemuda Surabaya',
 'Jl. Gubernur Suryo, Surabaya',
 -7.2634, 112.7445,
 500, ARRAY['Toilet', 'Ruang Aula', 'Listrik'],
 'building', ARRAY['flood'],
 false, 2, true),

-- 4. Gedung Robotika ITS
('Gedung Robotika ITS',
 'Sukolilo, Surabaya',
 -7.2819, 112.7952,
 700, ARRAY['Toilet', 'Listrik', 'Ruang Besar'],
 'building', ARRAY['flood', 'earthquake'],
 false, 2, true),

-- 5. RSUD Dr. Soetomo
('RSUD Dr. Soetomo',
 'Jl. Mayjen Prof. Dr. Moestopo, Surabaya',
 -7.2672, 112.7584,
 300, ARRAY['Medis', 'Toilet', 'Listrik'],
 'building', ARRAY['flood', 'earthquake'],
 false, 4, true),

-- 6. Lapangan Thor
('Lapangan Thor',
 'Jl. Padmosusastro, Surabaya',
 -7.2896, 112.7341,
 900, ARRAY['Area Terbuka', 'Titik Kumpul'],
 'open_area', ARRAY['earthquake'],
 true, 0, true),

-- 7. Taman Bungkul
('Taman Bungkul',
 'Jl. Taman Bungkul, Surabaya',
 -7.2913, 112.7398,
 400, ARRAY['Area Terbuka', 'Toilet'],
 'open_area', ARRAY['earthquake'],
 true, 0, true),

-- 8. Convention Hall Surabaya
('Convention Hall Surabaya',
 'Surabaya',
 -7.2810, 112.7420,
 1000, ARRAY['Ruang Besar', 'Listrik', 'Parkir'],
 'vertical_shelter', ARRAY['tsunami', 'flood'],
 false, 5, true);

