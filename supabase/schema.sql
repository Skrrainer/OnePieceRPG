-- ═══════════════════════════════════════════════════════════════════════════
--  GRAND LINE DISPATCH — Supabase Schema
--  Run this entire file in your Supabase SQL Editor:
--  https://supabase.com/dashboard → SQL Editor → New Query → Paste → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ── players table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.players (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL UNIQUE,
  passcode       TEXT        NOT NULL,
  combat_style   TEXT        NOT NULL CHECK (combat_style IN ('BRAWLER', 'SWORDSMAN', 'SNIPER')),
  sea_of_origin  TEXT        NOT NULL,
  current_island TEXT        NOT NULL DEFAULT 'g_1',
  day            INTEGER     NOT NULL DEFAULT 1,
  hp             INTEGER     NOT NULL DEFAULT 100,
  max_hp         INTEGER     NOT NULL DEFAULT 100,
  gold           INTEGER     NOT NULL DEFAULT 250,
  ship_hp        INTEGER     NOT NULL DEFAULT 100,
  ship_hp_max    INTEGER     NOT NULL DEFAULT 100,
  attack         INTEGER     NOT NULL DEFAULT 5,
  defense        INTEGER     NOT NULL DEFAULT 5,
  accuracy       INTEGER     NOT NULL DEFAULT 5,
  devil_fruit    TEXT        DEFAULT NULL,
  has_fruit      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert for all" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select by id"   ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow update by id"   ON public.players FOR UPDATE USING (true);

-- ── crew_roster table ──────────────────────────────────────────────────────
-- This is the master list of recruitable crew members.
-- Add, edit, or remove rows directly in the Supabase dashboard.
CREATE TABLE IF NOT EXISTS public.crew_roster (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT    NOT NULL,
  combat_style TEXT    NOT NULL CHECK (combat_style IN ('BRAWLER', 'SWORDSMAN', 'SNIPER')),
  attack       INTEGER NOT NULL DEFAULT 5,
  defense      INTEGER NOT NULL DEFAULT 5,
  accuracy     INTEGER NOT NULL DEFAULT 5,
  hp           INTEGER NOT NULL DEFAULT 80,
  max_hp       INTEGER NOT NULL DEFAULT 80,
  description  TEXT    NOT NULL DEFAULT '',
  rarity       TEXT    NOT NULL DEFAULT 'COMMON' CHECK (rarity IN ('COMMON', 'RARE', 'LEGENDARY')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.crew_roster ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select roster" ON public.crew_roster FOR SELECT USING (true);

-- ── player_crew table ──────────────────────────────────────────────────────
-- Tracks which roster members each player has recruited.
CREATE TABLE IF NOT EXISTS public.player_crew (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID        NOT NULL REFERENCES public.players(id)     ON DELETE CASCADE,
  crew_id     UUID        NOT NULL REFERENCES public.crew_roster(id) ON DELETE CASCADE,
  joined_day  INTEGER     NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (player_id, crew_id)  -- a player can't recruit the same member twice
);

ALTER TABLE public.player_crew ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow insert player_crew" ON public.player_crew FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select player_crew" ON public.player_crew FOR SELECT USING (true);
CREATE POLICY "Allow delete player_crew" ON public.player_crew FOR DELETE USING (true);

-- ── events table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sea_id              TEXT        NOT NULL DEFAULT 'all',
  difficulty          INTEGER     NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  type                TEXT        NOT NULL CHECK (type IN ('combat', 'loot', 'story', 'weather')),
  title               TEXT        NOT NULL,
  description         TEXT        NOT NULL,
  outcome_gold        INTEGER     NOT NULL DEFAULT 0,
  outcome_hp          INTEGER     NOT NULL DEFAULT 0,
  is_devil_fruit_drop BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select events" ON public.events FOR SELECT USING (true);

-- ── Seed crew_roster ───────────────────────────────────────────────────────
INSERT INTO public.crew_roster (name, combat_style, attack, defense, accuracy, hp, max_hp, description, rarity) VALUES
('One-Eyed Pete',     'BRAWLER',   11, 7,  3,  105, 105, 'A grizzled veteran with a scar across his left eye. Hits like a cannonball.', 'COMMON'),
('Saltwater Rosa',    'SNIPER',     4, 4,  13,  70,  70, 'Grew up on the crow''s nest. Rarely misses at any range.',                    'COMMON'),
('Iron Gut Hammond',  'BRAWLER',   10, 9,  2,  110, 110, 'Survived three Sea King attacks. His stomach is a legend of its own.',        'RARE'),
('Quick-Draw Vera',   'SNIPER',     5, 3,  14,  68,  68, 'Fastest draw in the East Blue. Now she''s in YOUR crew.',                    'COMMON'),
('The Bosun',         'SWORDSMAN',  7, 8,  6,   90,  90, 'Nobody knows his real name. He just fixes things and fights well.',          'COMMON'),
('Cannonball Cho',    'BRAWLER',   12, 6,  4,  100, 100, 'Aims herself at enemies like a human projectile. Effective.',                 'RARE'),
('Navigator Flynn',   'SWORDSMAN',  6, 7,  8,   88,  88, 'Has memorized every current in the Grand Line. Decent with a blade too.',    'COMMON'),
('Cook Marcellus',    'SWORDSMAN',  8, 6,  7,   92,  92, 'A chef who fights with kitchen knives. Do not underestimate him.',           'COMMON'),
('Redbeard Tomas',    'BRAWLER',   13, 5,  3,   98,  98, 'Wanted in three seas. Joined your crew to stay low. For now.',               'RARE'),
('Silent Nami',       'SNIPER',     3, 5,  15,  65,  65, 'Has never spoken a single word. Her aim speaks for her.',                    'RARE'),
('Iron Will Brock',   'SWORDSMAN',  9, 10, 5,   95,  95, 'Former Marine lieutenant. Switched sides for reasons he won''t discuss.',    'LEGENDARY'),
('Lucky Finn',        'SNIPER',     6, 4,  12,  72,  72, 'Survived 40 battles without a scratch. Probably cursed. Or blessed.',        'COMMON');

-- ── Seed events data ───────────────────────────────────────────────────────
INSERT INTO public.events (sea_id, difficulty, type, title, description, outcome_gold, outcome_hp, is_devil_fruit_drop) VALUES
('all', 1, 'combat',  'Marine Patrol Vessel',      'A Marine sloop cuts across your bow, cannons primed. Fight or flee!',                                -20,  -18, FALSE),
('all', 1, 'loot',    'Floating Debris',            'A merchant''s crates bob in the water — spoils from a recent storm.',                                  60,    0, FALSE),
('all', 1, 'weather', 'Rogue Squall',               'Black clouds roll in with no warning. The hull groans as waves hammer the bow.',                         0,  -12, FALSE),
('all', 1, 'story',   'Friendly Fisherman',         'A weathered fisherman waves you down and offers fresh fish and local charts for a coin.',               30,    5, FALSE),
('all', 1, 'loot',    'Washed-Up Barrel',           'A sealed barrel drifts past — inside: salted provisions and a pouch of loose Berries.',                45,   10, FALSE),
('all', 1, 'weather', 'Calm Winds',                 'The sea is glass-flat. Beautiful, but the sails go limp. You drift for hours, losing provisions.',       0,   -5, FALSE),
('all', 1, 'story',   'Message in a Bottle',        'A corked bottle contains a crudely drawn treasure map. Might be worth following...',                    20,    0, FALSE),
('all', 1, 'combat',  'Petty Pirates',              'A small skiff crewed by desperate rookies tries to board you. Easy pickings.',                          50,   -8, FALSE),
('all', 2, 'story',   'Mysterious Castaway',        'A lone figure clings to a barrel — they offer intel about a hidden cove in exchange for passage.',      40,    0, FALSE),
('all', 2, 'combat',  'Pirate Ambush',              'A rival crew emerges from fog, cannons blazing. No parley — only powder and steel.',                    80,  -30, FALSE),
('all', 2, 'loot',    'Sunken Galleon',             'Your lookout spots a glint below the reef — an old war galleon with a cracked treasury.',              150,   -5, FALSE),
('all', 2, 'weather', 'Waterspout Ahead',           'A towering column of spinning water blocks your path. You fight the helm for an hour.',                  0,  -20, FALSE),
('all', 2, 'combat',  'Bounty Hunter''s Ship',      'Someone posted your flag on a wanted board. A hunter closes fast with a boarding hook.',                60,  -25, FALSE),
('all', 2, 'story',   'Black Market Trader',        'A lantern-lit junk slides alongside. The hooded merchant offers rare goods — at a price.',              70,    0, FALSE),
('all', 2, 'loot',    'Stranded Merchant',          'A merchant brig ran aground on a reef. The desperate captain trades cargo for a tow.',                120,    0, FALSE),
('all', 2, 'weather', 'Electric Storm',             'Lightning splits the sky. The crew panics. The mast takes a hit but holds — barely.',                    0,  -18, FALSE),
('all', 3, 'combat',  'Warlord''s Vanguard',        'A fleet bearing a Warlord''s crest bears down on you. Every hand to the cannons!',                    200,  -55, FALSE),
('all', 3, 'combat',  'Sea King Breach',            'A colossal Sea King erupts from the depths beneath your hull. Survive!',                                30,  -70, FALSE),
('all', 3, 'loot',    'Legendary Shipwreck',        'The wreck of a legendary pirate ship rests on an underwater plateau. The treasury is intact.',         300,  -10, FALSE),
('all', 3, 'weather', 'Magnetic Storm',             'Grand Line weather does the impossible — your compass spins wildly and the sky turns red.',               0,  -25, FALSE),
('all', 3, 'story',   'Ancient Poneglyph Island',   'A mist-shrouded island holds a Poneglyph. The inscriptions stir something deep in your crew.',         100,   10, FALSE),
('all', 3, 'combat',  'Rival Emperor''s Scout',     'A ship flying an Emperor''s Jolly Roger hails you — then opens fire without warning.',                 150,  -45, FALSE),
('all', 1, 'loot',    'Rare Fruit Sighting',        'A gnarled tree on a passing isle bears a strangely swirling fruit...',                                    0,    0, TRUE),
('all', 2, 'story',   'Devil Fruit Merchant',       'A peculiar old woman offers you a bizarrely patterned fruit from a locked chest. "One bite," she says.',  0,    0, TRUE),
('all', 3, 'loot',    'Fallen Emperor''s Treasure', 'Among the spoils of a defeated Emperor''s ship lies a single swirling fruit, glowing faintly.',           0,    0, TRUE);
