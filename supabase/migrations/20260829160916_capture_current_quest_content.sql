-- Capture the current live quest content (4 categories, 5 quests, 25 questions)
-- This migration makes the existing manually-seeded content reproducible.
-- Uses ON CONFLICT DO NOTHING for idempotency.

-- Category 1: Career & Purpose
INSERT INTO quest_categories (id, slug, name_id, name_en, icon, sort_order, is_archived)
VALUES ('a6faacdc-1ce7-431b-83f9-8eb5cb40ea0e', 'career', 'Karier & Tujuan', 'Career & Purpose', 'target', 1, false)
ON CONFLICT (id) DO NOTHING;

-- Category 2: Self-Discovery
INSERT INTO quest_categories (id, slug, name_id, name_en, icon, sort_order, is_archived)
VALUES ('efe03dd5-a071-488a-a25a-3b7c2d92e5c1', 'self_discovery', 'Penemuan Diri', 'Self-Discovery', 'sparkles', 2, false)
ON CONFLICT (id) DO NOTHING;

-- Category 3: Financial Wellness
INSERT INTO quest_categories (id, slug, name_id, name_en, icon, sort_order, is_archived)
VALUES ('439d73e4-4acd-4e5d-8aee-4ba8c4b60eda', 'financial', 'Keuangan', 'Financial Wellness', 'wallet', 3, false)
ON CONFLICT (id) DO NOTHING;

-- Category 4: Relationship & Boundaries
INSERT INTO quest_categories (id, slug, name_id, name_en, icon, sort_order, is_archived)
VALUES ('9e851295-0054-4257-ba30-6ae9b9383aa9', 'relationship', 'Hubungan & Batasan', 'Relationship & Boundaries', 'heart', 4, false)
ON CONFLICT (id) DO NOTHING;

-- Quest 1: Cek Energi Kerjamu (career, free, 50xp)
INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
VALUES ('b8b933f3-948c-41e0-baf9-452247a5c9c7', 'a6faacdc-1ce7-431b-83f9-8eb5cb40ea0e', 'Cek Energi Kerjamu', 'Your Work-Life Vibe Check', 'Kenali energi kerja yang bikin kamu benar-benar hidup.', 'Discover the kind of work energy that makes you feel truly alive.', 'free', 50, 1, true, false)
ON CONFLICT (id) DO NOTHING;

-- Quest 2: Lounge Overthinking (self_discovery, free, 50xp)
INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
VALUES ('5ea6ab47-519a-4edf-bbc7-e02c0d94dfed', 'efe03dd5-a071-488a-a25a-3b7c2d92e5c1', 'Lounge Overthinking', 'Overthinking Lounge', 'Petakan pikiran yang berisik jadi langkah yang lebih ringan.', 'Turn noisy thoughts into lighter, smaller steps.', 'free', 50, 1, true, false)
ON CONFLICT (id) DO NOTHING;

-- Quest 3: Peta Kekuatan Diri (self_discovery, premium, 70xp)
INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
VALUES ('27f2e051-4eed-403d-8759-d564a735600f', 'efe03dd5-a071-488a-a25a-3b7c2d92e5c1', 'Peta Kekuatan Diri', 'Strength Map', 'Temukan kekuatan tersembunyi yang udah ada di dalam dirimu.', 'Discover the hidden strengths already within you.', 'premium', 70, 2, true, false)
ON CONFLICT (id) DO NOTHING;

-- Quest 4: Isi Dompet vs Mental (financial, premium, 70xp)
INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
VALUES ('16877893-247c-492e-aea0-f259e498991f', '439d73e4-4acd-4e5d-8aee-4ba8c4b60eda', 'Isi Dompet vs Mental', 'Wallet vs Mind', 'Bikin hubungan yang lebih jujur dengan uangmu.', 'Build a more honest relationship with your money.', 'premium', 70, 1, true, false)
ON CONFLICT (id) DO NOTHING;

-- Quest 5: Batas yang Baik (relationship, free, 50xp)
INSERT INTO quests (id, category_id, title_id, title_en, description_id, description_en, tier_required, xp_reward, sort_order, is_published, is_archived)
VALUES ('3f116a06-dc38-4945-93db-4eac99c527f6', '9e851295-0054-4257-ba30-6ae9b9383aa9', 'Batas yang Baik', 'Healthy Boundaries', 'Belajar bilang tidak tanpa rasa bersalah.', 'Learn to say no without guilt.', 'free', 50, 2, true, false)
ON CONFLICT (id) DO NOTHING;

-- Questions for Quest 1: Cek Energi Kerjamu (Q1-Q2 from original seed, Q3-Q5 from add_5_questions migration)
INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
('b8b933f3-948c-41e0-baf9-452247a5c9c7', 'single_choice',
 'Hari kerja seperti apa yang bikin kamu merasa paling jadi diri sendiri?',
 'What kind of workday makes you feel most like yourself?',
 '[{"value":"create","label_id":"Hari dengan ruang buat bikin sesuatu caraku.","label_en":"A day with room to make things my way."},{"value":"people","label_id":"Hari penuh orang, energi, dan ide baru.","label_en":"A day full of people, energy, and new ideas."},{"value":"plan","label_id":"Hari dengan rencana jelas dan kemajuan yang kelihatan.","label_en":"A day with a clear plan and visible progress."},{"value":"deep","label_id":"Hari yang ngasih waktu buat mendalami sesuatu.","label_en":"A day that gives me time to go deep."}]',
 1),
('b8b933f3-948c-41e0-baf9-452247a5c9c7', 'single_choice',
 'Kamu pengen sedikit lebih banyak apa?',
 'What do you want a little more of?',
 '[{"value":"freedom","label_id":"Kebebasan buat memilih.","label_en":"Freedom to choose."},{"value":"structure","label_id":"Struktur yang bikin fokus.","label_en":"Structure that helps me focus."},{"value":"impact","label_id":"Dampak yang kelihatan.","label_en":"Visible impact."},{"value":"calm","label_id":"Ketenangan, bukan kejar target.","label_en":"Calm, not chasing targets."}]',
 2),
('b8b933f3-948c-41e0-baf9-452247a5c9c7', 'scale',
 'Seberapa puas kamu dengan keseimbangan kerja dan kehidupan pribadi saat ini?',
 'How satisfied are you with your current work-life balance?',
 '[{"value":"1","label_id":"Sangat tidak puas","label_en":"Very dissatisfied"},{"value":"2","label_id":"Tidak puas","label_en":"Dissatisfied"},{"value":"3","label_id":"Biasa saja","label_en":"Neutral"},{"value":"4","label_id":"Puas","label_en":"Satisfied"},{"value":"5","label_id":"Sangat puas","label_en":"Very satisfied"}]',
 3),
('b8b933f3-948c-41e0-baf9-452247a5c9c7', 'single_choice',
 'Apa yang paling sering menguras energimu di tempat kerja?',
 'What drains your energy the most at work?',
 '[{"value":"meetings","label_id":"Terlalu banyak rapat","label_en":"Too many meetings"},{"value":"unclear","label_id":"Tugas yang nggak jelas","label_en":"Unclear tasks"},{"value":"people","label_id":"Drama atau konflik orang","label_en":"People drama or conflict"},{"value":"boredom","label_id":"Bosan, nggak ada tantangan","label_en":"Boredom, no challenge"}]',
 4),
('b8b933f3-948c-41e0-baf9-452247a5c9c7', 'text',
 'Satu hal kecil apa yang bisa kamu ubah besok untuk bikin hari kerjamu lebih baik?',
 'What is one small thing you could change tomorrow to make your workday better?',
 NULL,
 5)
ON CONFLICT DO NOTHING;

-- Questions for Quest 2: Lounge Overthinking
INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
('5ea6ab47-519a-4edf-bbc7-e02c0d94dfed', 'single_choice',
 'Malam ini, pikiran kamu paling sering mampir ke mana?',
 'Tonight, where does your mind keep wandering?',
 '[{"value":"future","label_id":"Masa depan yang belum terjadi.","label_en":"The future that hasn''t happened yet."},{"value":"past","label_id":"Masa lalu yang nggak bisa diubah.","label_en":"The past that can''t be changed."},{"value":"compare","label_id":"Banding-bandingin diri sama orang lain.","label_en":"Comparing myself to others."},{"value":"belong","label_id":"Pertanyaan apakah aku cukup.","label_en":"The question of whether I''m enough."}]',
 1),
('5ea6ab47-519a-4edf-bbc7-e02c0d94dfed', 'single_choice',
 'Saat pikiran berisik, apa yang biasanya kamu lakukan?',
 'When your thoughts get loud, what do you usually do?',
 '[{"value":"scroll","label_id":"Scroll tanpa henti.","label_en":"Scroll endlessly."},{"value":"distract","label_id":"Cari distraksi.","label_en":"Find a distraction."},{"value":"sit","label_id":"Duduk dan biarkan lewat.","label_en":"Sit and let it pass."},{"value":"write","label_id":"Tulis apa yang dirasa.","label_en":"Write down what I feel."}]',
 2),
('5ea6ab47-519a-4edf-bbc7-e02c0d94dfed', 'scale',
 'Seberapa sering pikiran berputar mengganggu tidurmu?',
 'How often do racing thoughts interfere with your sleep?',
 '[{"value":"1","label_id":"Hampir nggak pernah","label_en":"Almost never"},{"value":"2","label_id":"Kadang-kadang","label_en":"Sometimes"},{"value":"3","label_id":"Cukup sering","label_en":"Fairly often"},{"value":"4","label_id":"Sering","label_en":"Often"},{"value":"5","label_id":"Setiap malam","label_en":"Every night"}]',
 3),
('5ea6ab47-519a-4edf-bbc7-e02c0d94dfed', 'multi_choice',
 'Strategi mana yang sudah kamu coba buat menenangkan pikiran?',
 'Which strategies have you tried to calm your thoughts?',
 '[{"value":"breath","label_id":"Latihan napas","label_en":"Breathing exercises"},{"value":"journal","label_id":"Menulis jurnal","label_en":"Journaling"},{"value":"walk","label_id":"Jalan kaki","label_en":"Going for a walk"},{"value":"talk","label_id":"Cerita ke teman","label_en":"Talking to a friend"},{"value":"music","label_id":"Dengerin musik","label_en":"Listening to music"}]',
 4),
('5ea6ab47-519a-4edf-bbc7-e02c0d94dfed', 'text',
 'Kalau kamu bisa bilang satu kalimat ke dirimu sendiri saat overthinking, apa itu?',
 'If you could say one sentence to yourself when overthinking, what would it be?',
 NULL,
 5)
ON CONFLICT DO NOTHING;

-- Questions for Quest 3: Peta Kekuatan Diri
INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
('27f2e051-4eed-403d-8759-d564a735600f', 'single_choice',
 'Saat kamu berhasil melewati hari yang sulit, apa yang paling membantu?',
 'When you get through a tough day, what helps the most?',
 '[{"value":"rest","label_id":"Istirahat dan reset.","label_en":"Rest and reset."},{"value":"talk","label_id":"Cerita ke orang terdekat.","label_en":"Talk to someone close."},{"value":"move","label_id":"Gerak tubuh, jalan, olahraga.","label_en":"Move my body, walk, exercise."},{"value":"create","label_id":"Bikin sesuatu, tulis, gambar.","label_en":"Make something, write, draw."}]',
 1),
('27f2e051-4eed-403d-8759-d564a735600f', 'multi_choice',
 'Aktivitas mana yang bikin kamu merasa paling hidup?',
 'Which activities make you feel most alive?',
 '[{"value":"learn","label_id":"Belajar hal baru.","label_en":"Learning something new."},{"value":"help","label_id":"Bantu orang lain.","label_en":"Helping others."},{"value":"compete","label_id":"Kompetisi sehat.","label_en":"Healthy competition."},{"value":"nature","label_id":"Di alam, jalan-jalan.","label_en":"Out in nature, walking around."},{"value":"build","label_id":"Bangun sesuatu dari nol.","label_en":"Building something from scratch."}]',
 2),
('27f2e051-4eed-403d-8759-d564a735600f', 'scale',
 'Seberapa well kamu mengenali kekuatanmu sendiri?',
 'How well do you know your own strengths?',
 '[{"value":"1","label_id":"Hampir nggak kenal","label_en":"Barely know them"},{"value":"2","label_id":"Sedikit tahu","label_en":"Somewhat know them"},{"value":"3","label_id":"Cukup kenal","label_en":"Fairly well"},{"value":"4","label_id":"Kenal baik","label_en":"Know them well"},{"value":"5","label_id":"Sangat kenal","label_en":"Know them deeply"}]',
 3),
('27f2e051-4eed-403d-8759-d564a735600f', 'single_choice',
 'Saat menghadapi tantangan baru, pendekatan pertamamu?',
 'When facing a new challenge, your first approach?',
 '[{"value":"plan","label_id":"Buat rencana dulu","label_en":"Make a plan first"},{"value":"dive","label_id":"Langsung terjun","label_en":"Dive right in"},{"value":"research","label_id":"Riset dulu","label_en":"Research first"},{"value":"ask","label_id":"Tanya orang yang lebih tahu","label_en":"Ask someone experienced"}]',
 4),
('27f2e051-4eed-403d-8759-d564a735600f', 'text',
 'Kekuatan apa yang sering orang lain lihat di kamu, tapi kamu sendiri nggak sadari?',
 'What strength do others see in you that you yourself dont realize?',
 NULL,
 5)
ON CONFLICT DO NOTHING;

-- Questions for Quest 4: Isi Dompet vs Mental
INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
('16877893-247c-492e-aea0-f259e498991f', 'single_choice',
 'Saat kamu mikir soal uang, perasaan pertama yang muncul?',
 'When you think about money, what feeling comes up first?',
 '[{"value":"worry","label_id":"Cemas.","label_en":"Worry."},{"value":"guilt","label_id":"Bersalah.","label_en":"Guilt."},{"value":"hope","label_id":"Harapan.","label_en":"Hope."},{"value":"avoid","label_id":"Mau nghindar.","label_en":"I want to avoid it."}]',
 1),
('16877893-247c-492e-aea0-f259e498991f', 'single_choice',
 'Dari mana kamu belajar soal uang waktu kecil?',
 'Where did you learn about money growing up?',
 '[{"value":"stress","label_id":"Lihat orang tua stres soal uang.","label_en":"Watching parents stress about money."},{"value":"silence","label_id":"Uang nggak pernah dibahas.","label_en":"Money was never discussed."},{"value":"open","label_id":"Dibahas terbuka dan jujur.","label_en":"Discussed openly and honestly."},{"value":"mystery","label_id":"Uang itu misteri.","label_en":"Money was a mystery."}]',
 2),
('16877893-247c-492e-aea0-f259e498991f', 'scale',
 'Seberapa cemas kamu soal uang bulan ini?',
 'How anxious are you about money this month?',
 '[{"value":"1","label_id":"Sangat nggak cemas","label_en":"Not anxious at all"},{"value":"2","label_id":"Sedikit cemas","label_en":"Slightly anxious"},{"value":"3","label_id":"Cemas","label_en":"Anxious"},{"value":"4","label_id":"Sangat cemas","label_en":"Very anxious"},{"value":"5","label_id":"Panik","label_en":"Panicking"}]',
 3),
('16877893-247c-492e-aea0-f259e498991f', 'single_choice',
 'Menurutmu, uang itu lebih dekat ke?',
 'To you, money is closest to?',
 '[{"value":"safety","label_id":"Rasa aman","label_en":"Safety"},{"value":"freedom","label_id":"Kebebasan","label_en":"Freedom"},{"value":"stress","label_id":"Sumber stres","label_en":"Source of stress"},{"value":"tool","label_id":"Alat buat capai tujuan","label_en":"A tool for goals"}]',
 4),
('16877893-247c-492e-aea0-f259e498991f', 'text',
 'Apa satu hal yang pengen kamu capai soal uang dalam 6 bulan ke depan?',
 'What is one thing you want to achieve with money in the next 6 months?',
 NULL,
 5)
ON CONFLICT DO NOTHING;

-- Questions for Quest 5: Batas yang Baik
INSERT INTO quest_questions (quest_id, question_type, question_id, question_en, options, sort_order) VALUES
('3f116a06-dc38-4945-93db-4eac99c527f6', 'single_choice',
 'Saat seseorang minta waktu kamu padahal kamu lagi capek, respons pertamamu?',
 'When someone asks for your time but you''re tired, your first response?',
 '[{"value":"yes","label_id":"Ya, tentu saja.","label_en":"Yes, of course."},{"value":"maybe","label_id":"Ya, tapi ragu.","label_en":"Yes, but hesitant."},{"value":"no","label_id":"Nggak, maaf.","label_en":"No, sorry."},{"value":"later","label_id":"Nanti saja ya.","label_en":"Maybe later."}]',
 1),
('3f116a06-dc38-4945-93db-4eac99c527f6', 'single_choice',
 'Apa yang paling sering bikin kamu kompromi batasmu?',
 'What most often makes you compromise your boundaries?',
 '[{"value":"guilt","label_id":"Rasa bersalah.","label_en":"Guilt."},{"value":"fear","label_id":"Takut bikin orang kecewa.","label_en":"Fear of disappointing someone."},{"value":"conflict","label_id":"Mau hindari konflik.","label_en":"Wanting to avoid conflict."},{"value":"people","label_id":"Terlalu peduli sama pendapat orang.","label_en":"Caring too much about others'' opinions."}]',
 2),
('3f116a06-dc38-4945-93db-4eac99c527f6', 'scale',
 'Seberapa nyaman kamu mengatakan tidak saat dibutuhkan?',
 'How comfortable are you saying no when needed?',
 '[{"value":"1","label_id":"Sangat tidak nyaman","label_en":"Very uncomfortable"},{"value":"2","label_id":"Tidak nyaman","label_en":"Uncomfortable"},{"value":"3","label_id":"Tergantung situasi","label_en":"Depends on situation"},{"value":"4","label_id":"Nyaman","label_en":"Comfortable"},{"value":"5","label_id":"Sangat nyaman","label_en":"Very comfortable"}]',
 3),
('3f116a06-dc38-4945-93db-4eac99c527f6', 'multi_choice',
 'Di area mana kamu paling sering kompromi batasmu?',
 'In which areas do you most often compromise your boundaries?',
 '[{"value":"work","label_id":"Pekerjaan","label_en":"Work"},{"value":"family","label_id":"Keluarga","label_en":"Family"},{"value":"friends","label_id":"Teman","label_en":"Friends"},{"value":"partner","label_id":"Pasangan","label_en":"Partner"},{"value":"self","label_id":"Diri sendiri","label_en":"Myself"}]',
 4),
('3f116a06-dc38-4945-93db-4eac99c527f6', 'text',
 'Satu batas yang pengen kamu pegang lebih kuat minggu depan?',
 'One boundary you want to hold firmer next week?',
 NULL,
 5)
ON CONFLICT DO NOTHING;