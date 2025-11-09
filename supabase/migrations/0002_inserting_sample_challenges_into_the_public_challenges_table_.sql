INSERT INTO public.challenges (name, description, start_date, end_date, target_minutes, reward_achievement_id)
VALUES
  ('Weekly Focus Sprint', 'Achieve 180 minutes of focus time this week.', NOW(), NOW() + INTERVAL '7 days', 180, NULL),
  ('Deep Work Challenge', 'Complete 5 focus sessions of at least 45 minutes each.', NOW(), NOW() + INTERVAL '14 days', 225, NULL),
  ('Early Bird Focus', 'Start a focus session before 8 AM for 3 days.', NOW(), NOW() + INTERVAL '7 days', 0, NULL);