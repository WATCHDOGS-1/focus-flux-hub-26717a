INSERT INTO public.achievements (name, description, icon_url, criteria_type, criteria_value)
VALUES
  ('First Focus', 'Completed your first focus session.', 'https://example.com/icons/first_focus.png', 'focus_sessions_count', '{"min_count": 1}'),
  ('Focus Streak: 7 Days', 'Completed a focus session for 7 consecutive days.', 'https://example.com/icons/streak_7.png', 'focus_streak_days', '{"min_days": 7}'),
  ('Marathoner', 'Accumulated 600 minutes (10 hours) of focus time.', 'https://example.com/icons/marathoner.png', 'total_focus_minutes', '{"min_minutes": 600}'),
  ('Social Butterfly', 'Sent 10 messages in the global chat.', 'https://example.com/icons/social_butterfly.png', 'chat_messages_count', '{"min_count": 10}');