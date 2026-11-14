-- Reference data: tags and streak pauses. Safe to run more than once.
-- Apply to the linked project with: npx supabase db push --remote --include-seed

-- ---------------------------------------------------------------------------
-- Tags: categories
-- ---------------------------------------------------------------------------
insert into public.tags (type, name, slug) values
  ('category', 'Software', 'software'),
  ('category', 'Web Apps', 'web-apps'),
  ('category', 'Mobile Apps', 'mobile-apps'),
  ('category', 'AI & Machine Learning', 'ai-machine-learning'),
  ('category', 'Data Science', 'data-science'),
  ('category', 'Hardware & Electronics', 'hardware-electronics'),
  ('category', 'Embedded & IoT', 'embedded-iot'),
  ('category', 'Robotics', 'robotics'),
  ('category', 'Mechanical Design', 'mechanical-design'),
  ('category', 'Aerospace', 'aerospace'),
  ('category', 'Biotech & Health', 'biotech-health'),
  ('category', 'Sustainability & Energy', 'sustainability-energy'),
  ('category', 'Game Development', 'game-development'),
  ('category', 'Design & UX', 'design-ux'),
  ('category', 'Art & Music', 'art-music'),
  ('category', 'Research', 'research'),
  ('category', 'Startup', 'startup')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Tags: Georgia Tech classes (project, design and lab heavy courses)
-- ---------------------------------------------------------------------------
insert into public.tags (type, name, slug) values
  -- Computing
  ('class', 'CS 1301', 'cs-1301'),
  ('class', 'CS 1331', 'cs-1331'),
  ('class', 'CS 1332', 'cs-1332'),
  ('class', 'CS 1371', 'cs-1371'),
  ('class', 'CS 2110', 'cs-2110'),
  ('class', 'CS 2200', 'cs-2200'),
  ('class', 'CS 2340', 'cs-2340'),
  ('class', 'CS 3311', 'cs-3311'),
  ('class', 'CS 3312', 'cs-3312'),
  ('class', 'CS 3510', 'cs-3510'),
  ('class', 'CS 3600', 'cs-3600'),
  ('class', 'CS 3630', 'cs-3630'),
  ('class', 'CS 4261', 'cs-4261'),
  ('class', 'CS 4400', 'cs-4400'),
  ('class', 'CS 4476', 'cs-4476'),
  ('class', 'CS 4641', 'cs-4641'),
  ('class', 'CX 4242', 'cx-4242'),
  -- Electrical and computer engineering
  ('class', 'ECE 2020', 'ece-2020'),
  ('class', 'ECE 2026', 'ece-2026'),
  ('class', 'ECE 2031', 'ece-2031'),
  ('class', 'ECE 2035', 'ece-2035'),
  ('class', 'ECE 2040', 'ece-2040'),
  ('class', 'ECE 3058', 'ece-3058'),
  ('class', 'ECE 4122', 'ece-4122'),
  ('class', 'ECE 4180', 'ece-4180'),
  -- Mechanical engineering
  ('class', 'ME 1670', 'me-1670'),
  ('class', 'ME 2016', 'me-2016'),
  ('class', 'ME 2110', 'me-2110'),
  ('class', 'ME 2202', 'me-2202'),
  ('class', 'ME 3057', 'me-3057'),
  ('class', 'ME 3180', 'me-3180'),
  ('class', 'ME 3210', 'me-3210'),
  ('class', 'ME 4182', 'me-4182'),
  -- Aerospace engineering
  ('class', 'AE 1601', 'ae-1601'),
  ('class', 'AE 2010', 'ae-2010'),
  ('class', 'AE 2610', 'ae-2610'),
  ('class', 'AE 3340', 'ae-3340'),
  -- Other schools
  ('class', 'BMED 2310', 'bmed-2310'),
  ('class', 'BMED 4602', 'bmed-4602'),
  ('class', 'ISYE 4106', 'isye-4106'),
  ('class', 'MSE 2001', 'mse-2001'),
  ('class', 'COE 2001', 'coe-2001'),
  ('class', 'CEE 4090', 'cee-4090'),
  ('class', 'LMC 2700', 'lmc-2700')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Tags: Georgia Tech clubs, teams and maker programs
-- ---------------------------------------------------------------------------
insert into public.tags (type, name, slug) values
  ('club', 'RoboJackets', 'robojackets'),
  ('club', 'GT Motorsports', 'gt-motorsports'),
  ('club', 'GT Off-Road', 'gt-off-road'),
  ('club', 'GT Solar Racing', 'gt-solar-racing'),
  ('club', 'HyTech Racing', 'hytech-racing'),
  ('club', 'Wreck Racing', 'wreck-racing'),
  ('club', 'EcoCAR', 'ecocar'),
  ('club', 'Yellow Jacket Space Program', 'yellow-jacket-space-program'),
  ('club', 'Ramblin'' Rocket Club', 'ramblin-rocket-club'),
  ('club', 'GT Experimental Rocketry', 'gt-experimental-rocketry'),
  ('club', 'Design Build Fly', 'design-build-fly'),
  ('club', 'Marine Robotics Group', 'marine-robotics-group'),
  ('club', 'Invention Studio', 'invention-studio'),
  ('club', 'The Hive', 'the-hive'),
  ('club', 'HexLabs', 'hexlabs'),
  ('club', 'Bits of Good', 'bits-of-good'),
  ('club', 'GT WebDev', 'gt-webdev'),
  ('club', 'Big Data Big Impact', 'big-data-big-impact'),
  ('club', 'Data Science at Georgia Tech', 'data-science-at-georgia-tech'),
  ('club', 'The Agency', 'the-agency'),
  ('club', 'GreyHat', 'greyhat'),
  ('club', 'VGDev', 'vgdev'),
  ('club', 'iOS Club', 'ios-club'),
  ('club', 'Blockchain at Georgia Tech', 'blockchain-at-georgia-tech'),
  ('club', 'Quantum Computing Association', 'quantum-computing-association'),
  ('club', 'Startup Exchange', 'startup-exchange'),
  ('club', 'CREATE-X', 'create-x'),
  ('club', 'Vertically Integrated Projects', 'vertically-integrated-projects'),
  ('club', 'Engineers Without Borders', 'engineers-without-borders'),
  ('club', 'iGEM', 'igem'),
  ('club', 'IEEE', 'ieee'),
  ('club', 'Society of Women Engineers', 'society-of-women-engineers'),
  ('club', 'Epic Intentions', 'epic-intentions'),
  ('club', 'Buzz Studios', 'buzz-studios')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Streak pauses, 2026-27 academic year. Each row is the Monday of a paused week.
--   Finals: registrar final exam matrices (Fall: Dec 10-17, 2026; Spring: Apr 29-May 6, 2027).
--   Spring break and the Jan 11 spring start: registrar tentative calendar. Re-check once final.
-- ---------------------------------------------------------------------------
insert into public.streak_pauses (week_start, reason) values
  ('2026-11-23', 'Thanksgiving break'),
  ('2026-12-07', 'Fall finals'),
  ('2026-12-14', 'Fall finals'),
  ('2026-12-21', 'Winter break'),
  ('2026-12-28', 'Winter break'),
  ('2027-01-04', 'Winter break'),
  ('2027-03-22', 'Spring break'),
  ('2027-04-26', 'Spring finals'),
  ('2027-05-03', 'Spring finals')
on conflict (week_start) do nothing;
