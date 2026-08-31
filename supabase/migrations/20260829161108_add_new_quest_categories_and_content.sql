-- Add 3 new quest categories with 2-3 quests each, 5 questions per quest
-- Categories: Health & Recovery, Habits & Productivity, Communication & Connection

DO $$
DECLARE
  v_health_cat uuid;
  v_habits_cat uuid;
  v_comm_cat uuid;
  v_sleep_quest uuid;
  v_energy_quest uuid;
  v_stress_quest uuid;
  v_morning_quest uuid;
  v_focus_quest uuid;
  v_listen_quest uuid;
  v_speak_quest uuid;
  v_connect_quest uuid;
BEGIN
  -- ===== CATEGORY 5: Health & Recovery =====
  INSERT INTO quest_categories (id, slug, name_id, name_en, icon, sort_order, is_archived)
  VALUES (gen_random_uuid(), 'health', 'Kesehatan & Pemulihan', 'Health & Recovery', 'heart', 5, false)
  RETURNING id INTO v_health_cat;

  -- Quest: Tidur yang Lebih Baik (free, 50xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_health_cat, 'Tidur yang Lebih Baik', 'Better Sleep Tonight', 'Pahami kebiasaan tidurmu dan temukan cara istirahat lebih nyenyak.', 'Understand your sleep habits and find ways to rest more deeply.', 'free', 50, 1, true, false)
  RETURNING id INTO v_sleep_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_sleep_quest, 'single_choice',
   'Malam ini, seberapa mudah kamu bisa tertidur?',
   'Tonight, how easily can you fall asleep?',
   '[{"value":"fast","label_id":"Cepat, kurang dari 15 menit.","label_en":"Fast, under 15 minutes."},{"value":"medium","label_id":"Biasa, 15-30 menit.","label_en":"Moderate, 15-30 minutes."},{"value":"slow","label_id":"Lama, lebih dari 30 menit.","label_en":"Slow, more than 30 minutes."},{"value":"cant","label_id":"Sering nggak bisa sama sekali.","label_en":"Often can''t at all."}]',
   1),
  (v_sleep_quest, 'single_choice',
   'Apa yang paling sering mengganggu tidurmu?',
   'What most often disrupts your sleep?',
   '[{"value":"phone","label_id":"HP dan layar.","label_en":"Phone and screens."},{"value":"thoughts","label_id":"Pikiran yang berputar.","label_en":"Racing thoughts."},{"value":"noise","label_id":"Suara atau lingkungan.","label_en":"Noise or environment."},{"value":"caffeine","label_id":"Kafein terlalu sore.","label_en":"Caffeine too late."}]',
   2),
  (v_sleep_quest, 'scale',
   'Seberapa segar kamu merasa saat bangun pagi?',
   'How fresh do you feel when you wake up?',
   '[{"value":"1","label_id":"Sangat lelah","label_en":"Exhausted"},{"value":"2","label_id":"Lelah","label_en":"Tired"},{"value":"3","label_id":"Biasa","label_en":"Neutral"},{"value":"4","label_id":"Segar","label_en":"Fresh"},{"value":"5","label_id":"Sangat segar","label_en":"Very fresh"}]',
   3),
  (v_sleep_quest, 'multi_choice',
   'Kebiasaan mana yang sudah kamu coba buat tidur lebih baik?',
   'Which habits have you tried for better sleep?',
   '[{"value":"routine","label_id":"Jadwal tidur konsisten.","label_en":"Consistent sleep schedule."},{"value":"screenoff","label_id":"Matikan layar 1 jam sebelum tidur.","label_en":"No screens 1 hour before bed."},{"value":"read","label_id":"Baca buku.","label_en":"Read a book."},{"value":"tea","label_id":"Minum teh chamomile.","label_en":"Drink chamomile tea."},{"value":"dark","label_id":"Ruangan gelap dan dingin.","label_en":"Dark and cool room."}]',
   4),
  (v_sleep_quest, 'text',
   'Satu hal kecil yang bisa kamu lakukan malam ini buat tidur lebih nyenyak?',
   'One small thing you could do tonight for deeper sleep?',
   NULL,
   5);

  -- Quest: Energi dari Dalam (premium, 70xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_health_cat, 'Energi dari Dalam', 'Energy from Within', 'Temukan sumber energi yang sebenarnya bikin kamu bertenaga sepanjang hari.', 'Discover the energy sources that truly fuel you through the day.', 'premium', 70, 2, true, false)
  RETURNING id INTO v_energy_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_energy_quest, 'single_choice',
   'Jam berapa kamu biasanya merasa energi paling rendah?',
   'When do you usually feel your energy lowest?',
   '[{"value":"morning","label_id":"Pagi hari.","label_en":"In the morning."},{"value":"noon","label_id":"Siang hari.","label_en":"Around midday."},{"value":"afternoon","label_id":"Sore hari.","label_en":"In the afternoon."},{"value":"evening","label_id":"Malam hari.","label_en":"In the evening."}]',
   1),
  (v_energy_quest, 'single_choice',
   'Apa yang biasanya kamu lakukan saat energi lagi rendah?',
   'What do you usually do when your energy dips?',
   '[{"value":"caffeine","label_id":"Minum kopi atau energi.","label_en":"Drink coffee or energy drinks."},{"value":"sugar","label_id":"Makan sesuatu yang manis.","label_en":"Eat something sweet."},{"value":"rest","label_id":"Istirahat sebentar.","label_en":"Take a short rest."},{"value":"push","label_id":"Dipaksa terus.","label_en":"Push through it."}]',
   2),
  (v_energy_quest, 'scale',
   'Seberapa sering kamu merasa punya energi cukup buat hari ini?',
   'How often do you feel you have enough energy for the day?',
   '[{"value":"1","label_id":"Hampir nggak pernah","label_en":"Almost never"},{"value":"2","label_id":"Jarang","label_en":"Rarely"},{"value":"3","label_id":"Kadang","label_en":"Sometimes"},{"value":"4","label_id":"Sering","label_en":"Often"},{"value":"5","label_id":"Hampir selalu","label_en":"Almost always"}]',
   3),
  (v_energy_quest, 'multi_choice',
   'Apa yang bikin kamu merasa lebih bertenaga?',
   'What makes you feel more energized?',
   '[{"value":"water","label_id":"Minum cukup air.","label_en":"Drinking enough water."},{"value":"move","label_id":"Gerak tubuh, olahraga.","label_en":"Moving my body, exercise."},{"value":"sun","label_id":"Keluar dan dapat sinar matahari.","label_en":"Going outside for sunlight."},{"value":"nap","label_id":"Tidur siang singkat.","label_en":"A short nap."},{"value":"food","label_id":"Makan makanan bergizi.","label_en":"Eating nutritious food."}]',
   4),
  (v_energy_quest, 'text',
   'Satu perubahan kecil yang bisa kamu lakukan besok buat energi lebih stabil?',
   'One small change you could make tomorrow for steadier energy?',
   NULL,
   5);

  -- Quest: Reset Stres (free, 50xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_health_cat, 'Reset Stres', 'Stress Reset', 'Cara-cara kecil buat melepaskan beban sebelum menumpuk.', 'Small ways to release tension before it piles up.', 'free', 50, 3, true, false)
  RETURNING id INTO v_stress_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_stress_quest, 'single_choice',
   'Stres kamu paling sering dirasakan di mana?',
   'Where do you most often feel stress in your body?',
   '[{"value":"head","label_id":"Kepala atau leher.","label_en":"Head or neck."},{"value":"chest","label_id":"Dada atau jantung.","label_en":"Chest or heart."},{"value":"stomach","label_id":"Perut atau pencernaan.","label_en":"Stomach or digestion."},{"value":"muscle","label_id":"Otot tegang.","label_en":"Tense muscles."}]',
   1),
  (v_stress_quest, 'single_choice',
   'Saat stres melanda, apa respons pertamamu?',
   'When stress hits, what''s your first response?',
   '[{"value":"freeze","label_id":"Diam dan kaku.","label_en":"Freeze and stiffen."},{"value":"rush","label_id":"Buruan ngerjain semuanya.","label_en":"Rush to do everything."},{"value":"avoid","label_id":"Nghindar dan procrastinate.","label_en":"Avoid and procrastinate."},{"value":"breathe","label_id":"Napas dalam dan reset.","label_en":"Breathe deep and reset."}]',
   2),
  (v_stress_quest, 'scale',
   'Seberapa sering stres mengganggu aktivitas harianmu?',
   'How often does stress interfere with your daily activities?',
   '[{"value":"1","label_id":"Hampir nggak pernah","label_en":"Almost never"},{"value":"2","label_id":"Jarang","label_en":"Rarely"},{"value":"3","label_id":"Kadang","label_en":"Sometimes"},{"value":"4","label_id":"Sering","label_en":"Often"},{"value":"5","label_id":"Selalu","label_en":"Almost always"}]',
   3),
  (v_stress_quest, 'multi_choice',
   'Apa yang biasanya membantu kamu merasa lebih tenang?',
   'What usually helps you feel calmer?',
   '[{"value":"walk","label_id":"Jalan kaki.","label_en":"Walking."},{"value":"music","label_id":"Dengerin musik.","label_en":"Listening to music."},{"value":"talk","label_id":"Cerita ke seseorang.","label_en":"Talking to someone."},{"value":"breathe","label_id":"Latihan napas.","label_en":"Breathing exercises."},{"value":"nature","label_id":"Di alam.","label_en":"Being in nature."}]',
   4),
  (v_stress_quest, 'text',
   'Satu hal kecil yang bisa kamu lakukan hari ini buat melepaskan stres?',
   'One small thing you could do today to release stress?',
   NULL,
   5);

  -- ===== CATEGORY 6: Habits & Productivity =====
  INSERT INTO quest_categories (id, slug, name_id, name_en, icon, sort_order, is_archived)
  VALUES (gen_random_uuid(), 'habits', 'Kebiasaan & Produktivitas', 'Habits & Productivity', 'zap', 6, false)
  RETURNING id INTO v_habits_cat;

  -- Quest: Ritual Pagi (free, 50xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_habits_cat, 'Ritual Pagi', 'Morning Ritual', 'Rancang pagi yang bikin kamu mulai hari dengan tenang.', 'Design a morning that helps you start the day calm.', 'free', 50, 1, true, false)
  RETURNING id INTO v_morning_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_morning_quest, 'single_choice',
   'Apa hal pertama yang kamu lakukan saat bangun?',
   'What is the first thing you do when you wake up?',
   '[{"value":"phone","label_id":"Cek HP.","label_en":"Check my phone."},{"value":"stretch","label_id":"Regang dan gerak tubuh.","label_en":"Stretch and move."},{"value":"water","label_id":"Minum air.","label_en":"Drink water."},{"value":"snooze","label_id":"Tidur lagi.","label_en":"Snooze again."}]',
   1),
  (v_morning_quest, 'single_choice',
   'Pagi yang kayak gimana yang bikin kamu merasa siap buat hari?',
   'What kind of morning makes you feel ready for the day?',
   '[{"value":"slow","label_id":"Pelan dan tenang.","label_en":"Slow and calm."},{"value":"active","label_id":"Aktif dan gerak.","label_en":"Active and moving."},{"value":"quiet","label_id":"Hening dan sendiri.","label_en":"Quiet and alone."},{"value":"social","label_id":"Bareng orang.","label_en":"With others."}]',
   2),
  (v_morning_quest, 'scale',
   'Seberapa sering kamu merasa punya pagi yang baik?',
   'How often do you feel you have a good morning?',
   '[{"value":"1","label_id":"Hampir nggak pernah","label_en":"Almost never"},{"value":"2","label_id":"Jarang","label_en":"Rarely"},{"value":"3","label_id":"Kadang","label_en":"Sometimes"},{"value":"4","label_id":"Sering","label_en":"Often"},{"value":"5","label_id":"Hampir selalu","label_en":"Almost always"}]',
   3),
  (v_morning_quest, 'multi_choice',
   'Kebiasaan pagi mana yang pengen kamu coba?',
   'Which morning habits would you like to try?',
   '[{"value":"journal","label_id":"Tulis jurnal singkat.","label_en":"Short journaling."},{"value":"meditate","label_id":"Meditasi 5 menit.","label_en":"5-minute meditation."},{"value":"walk","label_id":"Jalan pagi.","label_en":"Morning walk."},{"value":"breakfast","label_id":"Sarapan tenang.","label_en":"Calm breakfast."},{"value":"plan","label_id":"Rencanakan hari.","label_en":"Plan the day."}]',
   4),
  (v_morning_quest, 'text',
   'Satu kebiasaan pagi kecil yang bisa kamu mulai besok?',
   'One small morning habit you could start tomorrow?',
   NULL,
   5);

  -- Quest: Fokus yang Dalam (premium, 70xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_habits_cat, 'Fokus yang Dalam', 'Deep Focus', 'Temukan cara untuk fokus lebih dalam tanpa distraksi.', 'Find ways to focus more deeply without distraction.', 'premium', 70, 2, true, false)
  RETURNING id INTO v_focus_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_focus_quest, 'single_choice',
   'Saat kamu perlu fokus, apa yang paling sering mengganggu?',
   'When you need to focus, what most often interrupts you?',
   '[{"value":"phone","label_id":"Notifikasi HP.","label_en":"Phone notifications."},{"value":"people","label_id":"Orang di sekitar.","label_en":"People around me."},{"value":"thoughts","label_id":"Pikiran sendiri.","label_en":"My own thoughts."},{"value":"boredom","label_id":"Bosan dan gampang beralih.","label_en":"Boredom and task-switching."}]',
   1),
  (v_focus_quest, 'single_choice',
   'Berapa lama kamu biasanya bisa fokus penuh sebelum gangguan?',
   'How long can you usually focus fully before a distraction?',
   '[{"value":"5min","label_id":"Kurang dari 10 menit.","label_en":"Less than 10 minutes."},{"value":"15min","label_id":"10-20 menit.","label_en":"10-20 minutes."},{"value":"30min","label_id":"20-45 menit.","label_en":"20-45 minutes."},{"value":"60min","label_id":"Lebih dari 45 menit.","label_en":"More than 45 minutes."}]',
   2),
  (v_focus_quest, 'scale',
   'Seberapa puas kamu dengan kemampuan fokusmu saat ini?',
   'How satisfied are you with your current ability to focus?',
   '[{"value":"1","label_id":"Sangat tidak puas","label_en":"Very dissatisfied"},{"value":"2","label_id":"Tidak puas","label_en":"Dissatisfied"},{"value":"3","label_id":"Biasa","label_en":"Neutral"},{"value":"4","label_id":"Puas","label_en":"Satisfied"},{"value":"5","label_id":"Sangat puas","label_en":"Very satisfied"}]',
   3),
  (v_focus_quest, 'multi_choice',
   'Strategi mana yang bikin kamu lebih fokus?',
   'Which strategies help you focus better?',
   '[{"value":"timer","label_id":"Timer pomodoro.","label_en":"Pomodoro timer."},{"value":"music","label_id":"Musik tanpa lirik.","label_en":"Music without lyrics."},{"value":"clean","label_id":"Meja bersih.","label_en":"Clean desk."},{"value":"phoneoff","label_id":"HP di mode senyap.","label_en":"Phone on silent."},{"value":"single","label_id":"Satu tugas saja.","label_en":"One task at a time."}]',
   4),
  (v_focus_quest, 'text',
   'Satu perubahan kecil yang bisa kamu lakukan besok buat fokus lebih dalam?',
   'One small change you could make tomorrow for deeper focus?',
   NULL,
   5);

  -- ===== CATEGORY 7: Communication & Connection =====
  INSERT INTO quest_categories (id, slug, name_id, name_en, icon, sort_order, is_archived)
  VALUES (gen_random_uuid(), 'communication', 'Komunikasi & Koneksi', 'Communication & Connection', 'message', 7, false)
  RETURNING id INTO v_comm_cat;

  -- Quest: Mendengar yang Sebenarnya (free, 50xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_comm_cat, 'Mendengar yang Sebenarnya', 'Listening Deeply', 'Pelajari cara mendengarkan dengan lebih hadir dan tulus.', 'Learn to listen with more presence and sincerity.', 'free', 50, 1, true, false)
  RETURNING id INTO v_listen_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_listen_quest, 'single_choice',
   'Saat seseorang cerita, apa yang paling sering kamu lakukan?',
   'When someone is talking, what do you most often do?',
   '[{"value":"fix","label_id":"Langsung kasih solusi.","label_en":"Jump to solutions."},{"value":"relate","label_id":"Nyambungin ke pengalamanku.","label_en":"Relate to my own experience."},{"value":"listen","label_id":"Dengerin penuh tanpa nyela.","label_en":"Listen fully without interrupting."},{"value":"distract","label_id":"Kadang terdistraksi.","label_en":"Sometimes get distracted."}]',
   1),
  (v_listen_quest, 'single_choice',
   'Apa yang bikin kamu merasa benar-benar didengar?',
   'What makes you feel truly heard?',
   '[{"value":"eye","label_id":"Kontak mata dan perhatian penuh.","label_en":"Eye contact and full attention."},{"value":"reflect","label_id":"Mereka mengulang apa yang aku bilang.","label_en":"They reflect back what I said."},{"value":"nod","label_id":"Tanggapan kecil yang nunjukkin mereka ikut.","label_en":"Small responses showing they''re following."},{"value":"time","label_id":"Mereka ngasih waktu tanpa buru-buru.","label_en":"They give time without rushing."}]',
   2),
  (v_listen_quest, 'scale',
   'Seberapa baik kamu merasa mendengarkan orang lain?',
   'How well do you feel you listen to others?',
   '[{"value":"1","label_id":"Sangat kurang","label_en":"Not well at all"},{"value":"2","label_id":"Kurang","label_en":"Below average"},{"value":"3","label_id":"Biasa","label_en":"Average"},{"value":"4","label_id":"Baik","label_en":"Good"},{"value":"5","label_id":"Sangat baik","label_en":"Very well"}]',
   3),
  (v_listen_quest, 'multi_choice',
   'Apa yang biasanya bikin kamu susah mendengarkan?',
   'What usually makes it hard for you to listen?',
   '[{"value":"think","label_id":"Lagi mikirin balasan.","label_en":"Thinking about my reply."},{"value":"emotion","label_id":"Tersinggung atau emosional.","label_en":"Feeling hurt or emotional."},{"value":"phone","label_id":"HP atau distraksi.","label_en":"Phone or distractions."},{"value":"tired","label_id":"Lega atau capek.","label_en":"Tired or drained."},{"value":"advice","label_id":"Kebelet kasih saran.","label_en":"Eager to give advice."}]',
   4),
  (v_listen_quest, 'text',
   'Satu cara kecil yang bisa kamu lakukan besok buat mendengarkan lebih dalam?',
   'One small way you could listen more deeply tomorrow?',
   NULL,
   5);

  -- Quest: Ngomong yang Jujur (premium, 70xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_comm_cat, 'Ngomong yang Jujur', 'Speaking Honestly', 'Temukan cara mengomunikasikan perasaan tanpa takut dikira lemah.', 'Find ways to communicate feelings without fear of seeming weak.', 'premium', 70, 2, true, false)
  RETURNING id INTO v_speak_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_speak_quest, 'single_choice',
   'Saat kamu merasa sesuatu mengganggumu, apa yang biasanya kamu lakukan?',
   'When something bothers you, what do you usually do?',
   '[{"value":"silent","label_id":"Diam dan simpan sendiri.","label_en":"Stay quiet and keep it in."},{"value":"hint","label_id":"Kasih hint tapi nggak langsung.","label_en":"Drop hints indirectly."},{"value":"talk","label_id":"Bicara langsung tapi hati-hati.","label_en":"Speak directly but carefully."},{"value":"burst","label_id":"Malah meledak nanti.","label_en":"Eventually burst out."}]',
   1),
  (v_speak_quest, 'single_choice',
   'Apa yang paling sering menahan kamu buat jujur?',
   'What most often holds you back from being honest?',
   '[{"value":"fear","label_id":"Takut bikin orang kecewa.","label_en":"Fear of disappointing someone."},{"value":"conflict","label_id":"Takut bikin konflik.","label_en":"Fear of causing conflict."},{"value":"burden","label_id":"Nganggap nggak penting.","label_en":"Feeling it''s a burden."},{"value":"vulnerable","label_id":"Takut kelihatan lemah.","label_en":"Fear of seeming weak."}]',
   2),
  (v_speak_quest, 'scale',
   'Seberapa nyaman kamu mengomunikasikan perasaanmu secara langsung?',
   'How comfortable are you expressing your feelings directly?',
   '[{"value":"1","label_id":"Sangat tidak nyaman","label_en":"Very uncomfortable"},{"value":"2","label_id":"Tidak nyaman","label_en":"Uncomfortable"},{"value":"3","label_id":"Tergantung situasi","label_en":"Depends on situation"},{"value":"4","label_id":"Nyaman","label_en":"Comfortable"},{"value":"5","label_id":"Sangat nyaman","label_en":"Very comfortable"}]',
   3),
  (v_speak_quest, 'multi_choice',
   'Situasi mana yang paling susah buat kamu jujur?',
   'Which situations are hardest for you to be honest in?',
   '[{"value":"work","label_id":"Di tempat kerja.","label_en":"At work."},{"value":"family","label_id":"Sama keluarga.","label_en":"With family."},{"value":"partner","label_id":"Sama pasangan.","label_en":"With a partner."},{"value":"friends","label_id":"Sama teman.","label_en":"With friends."},{"value":"self","label_id":"Sama diri sendiri.","label_en":"With myself."}]',
   4),
  (v_speak_quest, 'text',
   'Satu hal yang pengen kamu omongkan secara jujur minggu ini?',
   'One thing you want to say honestly this week?',
   NULL,
   5);

  -- Quest: Koneksi yang Bermakna (free, 50xp)
  INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
  VALUES (gen_random_uuid(), v_comm_cat, 'Koneksi yang Bermakna', 'Meaningful Connection', 'Cara kecil buat memperdalam hubungan dengan orang yang penting.', 'Small ways to deepen connections with people who matter.', 'free', 50, 3, true, false)
  RETURNING id INTO v_connect_quest;

  INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
  (v_connect_quest, 'single_choice',
   'Saat terakhir kali kamu merasa benar-benar terhubung dengan seseorang, kapan itu?',
   'When did you last feel truly connected to someone?',
   '[{"value":"today","label_id":"Hari ini.","label_en":"Today."},{"value":"week","label_id":"Minggu ini.","label_en":"This week."},{"value":"month","label_id":"Bulan ini.","label_en":"This month."},{"value":"long","label_id":"Sudah lama.","label_en":"It''s been a while."}]',
   1),
  (v_connect_quest, 'single_choice',
   'Apa yang bikin sebuah koneksi terasa bermakna buatmu?',
   'What makes a connection feel meaningful to you?',
   '[{"value":"depth","label_id":"Bisa jujur dan dalam.","label_en":"Being honest and deep."},{"value":"presence","label_id":"Kehadiran penuh.","label_en":"Full presence."},{"value":"shared","label_id":"Pengalaman yang dibagi.","label_en":"Shared experiences."},{"value":"support","label_id":"Saling dukung.","label_en":"Mutual support."}]',
   2),
  (v_connect_quest, 'scale',
   'Seberapa puas kamu dengan kualitas hubungan terdekatmu saat ini?',
   'How satisfied are you with the quality of your closest relationships?',
   '[{"value":"1","label_id":"Sangat tidak puas","label_en":"Very dissatisfied"},{"value":"2","label_id":"Tidak puas","label_en":"Dissatisfied"},{"value":"3","label_id":"Biasa","label_en":"Neutral"},{"value":"4","label_id":"Puas","label_en":"Satisfied"},{"value":"5","label_id":"Sangat puas","label_en":"Very satisfied"}]',
   3),
  (v_connect_quest, 'multi_choice',
   'Apa yang biasanya bikin kamu merasa lebih dekat dengan seseorang?',
   'What usually makes you feel closer to someone?',
   '[{"value":"talk","label_id":"Obrolan yang dalam.","label_en":"Deep conversations."},{"value":"listen","label_id":"Mereka mendengarkan dengan tulus.","label_en":"They listen sincerely."},{"value":"time","label_id":"Waktu berkualitas bersama.","label_en":"Quality time together."},{"value":"help","label_id":"Saling bantu saat susah.","label_en":"Helping each other in hard times."},{"value":"laugh","label_id":"Tertawa bareng.","label_en":"Laughing together."}]',
   4),
  (v_connect_quest, 'text',
   'Satu hal kecil yang bisa kamu lakukan minggu ini buat memperdalam sebuah hubungan?',
   'One small thing you could do this week to deepen a relationship?',
   NULL,
   5);
END $$;