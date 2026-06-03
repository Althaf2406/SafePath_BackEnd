INSERT INTO disaster_preparation_guides (disaster_type, title, description, handling_procedures, icon_name)
VALUES 
(
    'Flood',
    'Flood Preparation Guide',
    'Essential steps to take before, during, and after a flood.',
    '["Evacuate immediately to higher ground if advised.", "Do not walk, swim, or drive through floodwaters.", "Turn off utilities at the main switches if instructed."]'::JSONB,
    'cloud.heavyrain.fill'
),
(
    'Earthquake',
    'Earthquake Survival Guide',
    'What to do when an earthquake strikes to stay safe.',
    '["Drop, Cover, and Hold On.", "Stay away from glass, windows, outside doors and walls.", "If outside, move away from buildings, streetlights, and utility wires."]'::JSONB,
    'waveform.path.ecg'
);
