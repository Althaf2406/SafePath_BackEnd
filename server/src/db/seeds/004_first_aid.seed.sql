INSERT INTO first_aid_guides (title, category, short_description, icon_name, steps, required_kit, detailed_steps)
VALUES 
(
    'Broken Bone',
    'fractures',
    'Immobilization and splinting for suspected fractures.',
    'person.crop.circle.fill.badge.plus',
    '[]'::JSONB,
    '[{"id": "c1f7b0a0-0b1a-4c2a-9f5a-8b8a9c8b7a6d", "name": "Bandage", "status": "In Kit"}, {"id": "d2f7b0a0-0b1a-4c2a-9f5a-8b8a9c8b7a6e", "name": "Rigid Splint Material", "status": "Missing"}]'::JSONB,
    '[{"id": "e3f7b0a0-0b1a-4c2a-9f5a-8b8a9c8b7a6f", "title": "Keep the person still", "description": "Do not move the victim unnecessarily."}]'::JSONB
),
(
    'CPR',
    'cardiac',
    'Cardiopulmonary resuscitation for cardiac arrest.',
    'heart.fill',
    '[]'::JSONB,
    '[]'::JSONB,
    '[{"id": "f4f7b0a0-0b1a-4c2a-9f5a-8b8a9c8b7a7a", "title": "Check for responsiveness", "description": "Shake the person and ask if they are OK."}, {"id": "g5f7b0a0-0b1a-4c2a-9f5a-8b8a9c8b7a7b", "title": "Call emergency", "description": "Call local emergency number immediately."}, {"id": "h6f7b0a0-0b1a-4c2a-9f5a-8b8a9c8b7a7c", "title": "Start chest compressions", "description": "Push hard and fast in the center of the chest."}]'::JSONB
);
