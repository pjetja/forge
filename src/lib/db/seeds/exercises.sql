-- Exercise Library Seed Data
-- Replace YOUR_TRAINER_UUID with your actual Supabase auth UID
-- Find it: Supabase Dashboard → Authentication → Users → click your user → copy User UID

DO $$
DECLARE
  tid UUID := 'YOUR_TRAINER_UUID';
BEGIN

INSERT INTO exercises (trainer_auth_uid, name, muscle_group, description, notes) VALUES

-- Chest
(tid, 'Barbell Bench Press', 'Chest',
  'Classic compound press lying on a flat bench using a barbell.',
  'Keep shoulder blades retracted. Bar touches lower chest. Controlled descent ~2s.'),
(tid, 'Incline Dumbbell Press', 'Chest',
  'Dumbbell press on a 30–45° incline bench targeting the upper chest.',
  'Avoid flaring elbows too wide. Squeeze at the top.'),
(tid, 'Cable Fly (Low to High)', 'Chest',
  'Cable crossover from low pulleys arcing upward — maximises stretch and peak contraction.',
  'Slight forward lean. Keep a soft bend in elbows throughout.'),
(tid, 'Push-Up', 'Chest',
  'Bodyweight press with hands shoulder-width, body rigid from head to heels.',
  'For more chest activation, turn hands slightly outward. Full range of motion.'),

-- Upper Back
(tid, 'Barbell Row', 'Upper Back',
  'Hip-hinge row pulling a barbell toward the lower sternum, targeting mid-back thickness.',
  'Keep lower back neutral. Row to belt, not chest. Pause briefly at the top.'),
(tid, 'Seated Cable Row (Close Grip)', 'Upper Back',
  'Cable row on a low pulley pulling a V-bar to the abdomen.',
  'Drive elbows behind the body. Do not round forward at the catch.'),
(tid, 'Face Pull', 'Upper Back',
  'Rope attachment on a high cable pulled toward the face, targeting rear delts and rhomboids.',
  'Pull to forehead level. Externally rotate at the end to protect shoulders.'),

-- Lats
(tid, 'Pull-Up', 'Lats',
  'Bodyweight vertical pull gripping a fixed bar shoulder-width or wider.',
  'Full dead hang at the bottom. Drive elbows down and back, not just pulling with biceps.'),
(tid, 'Lat Pulldown', 'Lats',
  'Cable pulldown on a high pulley pulling a wide bar to the upper chest.',
  'Lean back slightly. Pull bar to clavicle. Avoid using momentum.'),
(tid, 'Single-Arm Dumbbell Row', 'Lats',
  'Unilateral row bracing one knee on a bench, pulling dumbbell toward hip.',
  'Keep the hip and shoulder aligned. Think "elbow to hip", not "elbow to ceiling".'),

-- Front Delts
(tid, 'Overhead Press (Barbell)', 'Front Delts',
  'Standing or seated barbell press from shoulders to lockout overhead.',
  'Brace core hard. Bar path slightly back over the head at lockout. No lower back arch.'),
(tid, 'Dumbbell Front Raise', 'Front Delts',
  'Bilateral or alternating raise of dumbbells from hip to shoulder height.',
  'Slight bend at elbow. Control the descent — front delts are small, go lighter than expected.'),

-- Side Delts
(tid, 'Dumbbell Lateral Raise', 'Side Delts',
  'Raise dumbbells to the side up to shoulder height, leading with the pinky side.',
  'Slight forward lean at hip. Thumb slightly lower than pinky at the top. No trap shrug.'),
(tid, 'Cable Lateral Raise', 'Side Delts',
  'Single-arm cable lateral raise from a low pulley for constant tension.',
  'Cross cable in front of body. Maintain tension at the bottom unlike dumbbells.'),

-- Rear Delts
(tid, 'Reverse Pec Deck', 'Rear Delts',
  'Seated machine fly in reverse, targeting rear deltoids and upper traps.',
  'Grip handles with thumbs up. Lead with elbows out rather than pulling with hands.'),
(tid, 'Band Pull-Apart', 'Rear Delts',
  'Resistance band pulled apart horizontally at chest height to activate rear delts.',
  'Keep arms straight. Squeeze shoulder blades together at the end range.'),

-- Biceps
(tid, 'Barbell Curl', 'Biceps',
  'Standing bilateral curl of a barbell from hips to chin.',
  'No swinging. Pause at the top and squeeze. Full extension at the bottom.'),
(tid, 'Incline Dumbbell Curl', 'Biceps',
  'Dumbbell curl performed seated on a 45–60° incline bench for extended stretch.',
  'Let arms hang fully. The stretch at the bottom is the key benefit of this variation.'),
(tid, 'Hammer Curl', 'Biceps',
  'Neutral-grip curl (palms facing each other) targeting the brachialis and brachioradialis.',
  'Can be done alternating. Keep elbows pinned to sides throughout.'),

-- Triceps
(tid, 'Triceps Rope Pushdown', 'Triceps',
  'Cable pushdown using a rope attachment from a high pulley.',
  'At the bottom, split rope slightly outward. Keep elbows stationary at sides.'),
(tid, 'Overhead Triceps Extension (EZ Bar)', 'Triceps',
  'EZ bar lowered behind the head seated or standing — maximises long-head stretch.',
  'Keep elbows pointing forward, not flaring. Move only at the elbow joint.'),
(tid, 'Close-Grip Bench Press', 'Triceps',
  'Barbell bench press with hands shoulder-width (not narrow) to emphasise triceps.',
  'Keep elbows about 45° from torso. Touch bar to mid-chest.'),
(tid, 'Diamond Push-Up', 'Triceps',
  'Push-up with hands forming a diamond shape directly under the chest.',
  'Keep elbows close to the body. More tricep-dominant than standard push-up.'),

-- Quads
(tid, 'Barbell Back Squat', 'Quads',
  'Compound lower-body exercise with barbell on upper traps, squatting below parallel.',
  'Knees track over toes. Chest up throughout. Controlled descent then drive through heels.'),
(tid, 'Leg Press', 'Quads',
  'Machine press pushing a weighted platform away from the body at an angle.',
  'Feet shoulder-width, low on the plate for more quad emphasis. Full range, no locking knees.'),
(tid, 'Leg Extension', 'Quads',
  'Isolation machine exercise extending the knee against resistance.',
  'Pause at full extension. Control the negative. Useful for quad finisher sets.'),
(tid, 'Bulgarian Split Squat', 'Quads',
  'Single-leg squat with rear foot elevated on a bench — high quad and glute demand.',
  'Most load through front heel. Torso slight forward lean. Go slow on the descent.'),

-- Hamstrings
(tid, 'Romanian Deadlift', 'Hamstrings',
  'Hip-hinge movement lowering a barbell along the legs while keeping knees soft.',
  'Feel stretch in hamstrings at the bottom. Bar stays close to body. Neutral spine throughout.'),
(tid, 'Lying Leg Curl', 'Hamstrings',
  'Machine curl of the lower leg toward the glutes while lying prone.',
  'Hips stay flat on the pad. Squeeze glutes to prevent hip flexor compensation.'),
(tid, 'Nordic Hamstring Curl', 'Hamstrings',
  'Bodyweight eccentric hamstring exercise lowering the torso under control toward the floor.',
  'Extremely demanding — use assistance on the way down initially. One of the best injury prevention exercises.'),

-- Glutes
(tid, 'Hip Thrust (Barbell)', 'Glutes',
  'Barbell hip hinge with upper back on a bench, driving hips to full extension.',
  'Chin tucked, ribs down. Drive through the whole foot. Pause and squeeze at the top.'),
(tid, 'Cable Kickback', 'Glutes',
  'Single-leg cable extension from a low pulley, kicking the leg behind the body.',
  'Slight hip flexion for a stretch. Move from the glute, not the lower back.'),
(tid, 'Sumo Deadlift', 'Glutes',
  'Wide-stance deadlift pulling a barbell from the floor with toes pointed outward.',
  'Push the floor apart. Hips closer to bar than conventional — more glute emphasis.'),

-- Calves
(tid, 'Standing Calf Raise', 'Calves',
  'Bilateral or unilateral rise onto toes under load — targets gastrocnemius.',
  'Full range: deep stretch at the bottom, full contraction at the top. Slow tempo.'),
(tid, 'Seated Calf Raise', 'Calves',
  'Machine calf raise performed seated with pads on knees — targets soleus.',
  'Knee at 90° isolates the soleus under the gastrocnemius. Use heavier loads here.'),

-- Core
(tid, 'Ab Wheel Rollout', 'Core',
  'Rolling an ab wheel forward from kneeling or standing, extending the body under full tension.',
  'Brace hard before rolling. Think "protect the lower back" — ribs down, pelvis neutral.'),
(tid, 'Hanging Leg Raise', 'Core',
  'Hanging from a bar, raising legs to 90° or higher to target the lower abs.',
  'Control the swing. Posterior pelvic tilt at the top to fully contract the abs.'),
(tid, 'Cable Crunch', 'Core',
  'Kneeling crunch pulling a rope from a high cable downward to flex the spine.',
  'It is a spinal flexion exercise — actively round the back. Keep hips stationary.'),
(tid, 'Plank', 'Core',
  'Isometric hold in push-up position maintaining a rigid body line.',
  'Squeeze glutes and quads. Push the floor away. No sagging hips or raised butt.');

END $$;
