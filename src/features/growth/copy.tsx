/* eslint-disable react-refresh/only-export-components -- Shared locale context and dictionary are intentional. */
import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./preferences";
const LanguageContext = createContext<Locale>("id");
export function CopyProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  return (
    <LanguageContext.Provider value={locale}>
      {children}
    </LanguageContext.Provider>
  );
}
export const english: Record<string, string> = {
  "Peta Energi": "Energy map",
  "Audit Hubungan": "Relationship reflection",
  "Kontrak Batasan Diri": "Personal boundaries",
  "Peta Finansial": "Financial map",
  "Rencana Aksi 24 Jam": "24-hour action plan",
  "Komitmen 90 Hari": "90-day commitment",
  "Simulator Konsistensi": "Consistency simulator",
  "Peta Diri & Pemulihan": "Self and recovery map",
  "Akar Harga Diri": "Roots of self-worth",
  "Menulis Ulang Keyakinan": "Reframing beliefs",
  "Baseline Tidur & Energi": "Sleep and energy baseline",
  "Rencana Digital Detox": "Digital pause plan",
  "Check-In Tubuh": "Body check-in",
  "Peta Skill & Minat": "Skills and interests",
  "Audit Nilai Kerja": "Work values reflection",
  "Satu Langkah Karier": "One career step",
  "Gaya Komunikasiku": "My communication style",
  "Skrip Percakapan Sulit": "A difficult conversation",
  "Latihan Respons Asertif": "Practicing an assertive response",
  "Audit Waktu 24 Jam": "24-hour time reflection",
  "Ritual Review Mingguan": "Weekly reflection ritual",
  "Cari tahu hal kecil yang membuatmu merasa lebih hidup.":
    "Notice the small things that help you feel more alive.",
  "Lihat relasimu dengan lebih jernih, tanpa menghakimi.":
    "Look at your relationships with curiosity and care.",
  "Ubah kebutuhanmu menjadi batasan yang bisa dikomunikasikan.":
    "Turn your needs into boundaries you can communicate.",
  "Mulai dari angka yang nyata, sekecil apa pun.":
    "Start with real numbers, however small.",
  "Dua langkah kecil lebih berarti daripada rencana sempurna.":
    "Two small steps are a good place to start.",
  "Buat sistem yang bisa bertahan, bukan sekadar semangat.":
    "Build a routine that lasts beyond the initial motivation.",
  "Lihat bagaimana kebiasaan menabung dapat bertumbuh.":
    "Explore how consistent saving can add up.",
  "Beri tempat untuk kekuatan dan kebutuhanmu.":
    "Make space for your strengths and needs.",
  "Kamu lebih besar dari satu masa sulit.":
    "One difficult chapter is not your whole story.",
  "Cari narasi yang lebih adil untuk dirimu.":
    "Find a fairer story to tell yourself.",
  "Kenali pola, tanpa mengejar skor sempurna.":
    "Notice patterns without chasing a perfect score.",
  "Ciptakan ruang tanpa layar yang masuk akal.":
    "Make a realistic plan for screen-free space.",
  "Dengarkan tubuhmu sebelum melanjutkan hari.":
    "Listen to your body before moving on with your day.",
  "Hubungkan yang kamu bisa dengan yang ingin kamu pelajari.":
    "Connect your strengths with what you want to learn.",
  "Apa yang paling kamu butuhkan dari pekerjaan?":
    "What do you need most from your work?",
  "Ubah arah besar menjadi satu aksi 30 hari.":
    "Turn a direction into one step for the next 30 days.",
  "Amati kebiasaanmu, bukan memberi label permanen.":
    "Observe your habits without giving yourself a permanent label.",
  "Jujur tentang perasaan, jelas tentang kebutuhan.":
    "Be honest about feelings and clear about needs.",
  "Latihan kecil sebelum percakapan nyata.":
    "A little practice before the real conversation.",
  "Lihat ke mana waktumu pergi, tanpa menghakimi.":
    "Notice where your time goes, with curiosity.",
  "Tempelkan kebiasaan baru pada rutinitas yang sudah ada.":
    "Link a new habit to a routine you already have.",
  "Luangkan waktu untuk melihat sejauh apa kamu berjalan.":
    "Take a moment to notice how far you’ve come.",
  "Kenali yang mengisi energimu. Beri ruang untuk dirimu.":
    "Notice what restores your energy. Make room for yourself.",
  "Bangun hubungan yang lebih tenang dengan uang.":
    "Build a calmer relationship with money.",
  "Temukan nilai diri, di luar ekspektasi orang lain.":
    "Explore who you are beyond other people’s expectations.",
  "Istirahat juga bagian dari perjalanan.": "Rest is part of the journey too.",
  "Buat langkah kerja yang selaras dengan nilai hidupmu.":
    "Take career steps that fit your values.",
  "Sampaikan kebutuhanmu dengan jujur dan hangat.":
    "Express your needs honestly and kindly.",
  "Kecil, realistis, dan bisa kamu ulangi.":
    "Small, realistic steps you can repeat.",
  "Preview formulir": "Form preview",
  "Simpan konten": "Save content",
  "Lewati ke konten": "Skip to content",
  "Tumbuh dengan ritmemu.": "Grow at your own pace.",
  "Kecil hari ini.": "A small step today.",
  "Berarti di kemudian hari.": "Something to build on tomorrow.",
  "Memuat progres akun…": "Loading your progress…",
  "Progres tersimpan di browser ini": "Progress saved in this browser",
  "Hubungkan akun": "Connect your account",
  "SETIAP LANGKAH ITU BERARTI": "EVERY SMALL STEP COUNTS",
  "Hai,": "Hi,",
  "Yuk, tumbuh lagi.": "Make a little room for yourself.",
  "Kamu nggak perlu menyelesaikan semuanya hari ini.":
    "You don’t have to figure everything out today.",
  "pelan-pelan juga sampai.": "your pace is enough.",
  "Jalur bertumbuhmu": "Your path to growth",
  "Satu quest, satu hal baru tentang dirimu.":
    "One quest. A little more self-understanding.",
  "Semua unit": "All units",
  "Refleksi interaktif": "Interactive reflection",
  "Selesaikan unit untuk membuka lencana": "Complete the unit to earn a badge",
  "Perjalananmu bukan perlombaan. Kamu boleh istirahat.":
    "This is your journey. There’s room for rest.",
  "TEMUKAN RUANG YANG KAMU BUTUHKAN": "FIND WHAT YOU NEED TODAY",
  "Jelajahi perjalanan": "Explore your journey",
  "Tujuh area hidup. Satu langkah kecil untuk mulai.":
    "Seven areas of life. One small place to start.",
  "SESUAIKAN RUANGMU": "MAKE THIS SPACE YOURS",
  Pengaturan: "Settings",
  "Perjalanan ini milikmu.": "Your journey, your preferences.",
  "Profil & ritme": "Profile and pace",
  "Nama panggilan": "Display name",
  "Target waktu harian": "Daily time goal",
  menit: "minutes",
  "Simpan profil": "Save profile",
  "Keluar akun": "Sign out",
  "Coba sinkronkan": "Retry sync",
  "Ekspor data pribadi": "Export private data",
  "Ekspor JSON berisi refleksi pribadi. Simpan di tempat yang kamu percaya.":
    "This JSON export contains private reflections. Keep it somewhere you trust.",
  "Hapus progres perangkat ini": "Delete progress on this device",
  "Jaga langkah kecilmu": "Keep your small steps going",
  "hari bertumbuh": "days of growth",
  "Streak Freeze tersimpan": "Streak Freezes available",
  "Apa kabarmu hari ini?": "How are you feeling today?",
  "Nggak perlu selalu baik-baik saja.":
    "You don’t have to feel okay all the time.",
  "Misi harian": "Daily missions",
  "Lihat semua": "View all",
  "Teman satu perjalanan": "Company along the way",
  "Tumbuh bareng penjelajah lain.": "Grow alongside others.",
  "Saling dukung, bukan saling buru.":
    "A little encouragement goes a long way.",
  "Lihat ruang bersama": "Visit your shared space",
  "“Satu langkah kecil hari ini sudah lebih dari cukup.”":
    "“One small step is a good place to start.”",
  "tarsio. · Ruang aman untuk bertumbuh":
    "tarsio. · A supportive space to grow",
  "XP minggu ini": "XP this week",
  "Hapus progres perangkat?": "Delete device progress?",
  "Refleksi, XP, dan pengaturan lokal akan dihapus. Ekspor data terlebih dahulu jika ingin menyimpannya.":
    "Local reflections, XP and settings will be deleted. Export your data first if you want to keep it.",
  Batal: "Cancel",
  "Hapus progres": "Delete progress",
  "Ruang racik quest": "Create thoughtful quests",
  "Kelola alur, pertanyaan, dan publikasi dalam satu tempat.":
    "Manage the journey, questions and publishing in one place.",
  "Preview CMS lokal. Perubahan hanya berlaku di perangkat ini. Pada aplikasi tersambung, hanya admin yang bisa mengubah konten.":
    "Local CMS preview. Changes apply only in this browser. Connected content can be edited only by an administrator.",
  Pengguna: "Users",
  "Quest diselesaikan": "Completed quests",
  "Aktif minggu ini": "Active this week",
  "Halaman ini hanya tersedia untuk admin.":
    "This page is available to administrators only.",
  "← Daftar konten": "← Content list",
  "Judul quest": "Quest title",
  Deskripsi: "Description",
  "Durasi (menit)": "Duration (minutes)",
  "Terbitkan untuk pengguna": "Publish for users",
  Langkah: "Step",
  "Judul langkah": "Step title",
  Petunjuk: "Guidance",
  Pertanyaan: "Question",
  "Tipe input": "Input type",
  "ID data (tetap untuk jawaban lama)":
    "Data ID (keep stable for existing answers)",
  "Pilihan, satu per baris": "Options, one per line",
  "Wajib diisi": "Required",
  "Tambah langkah": "Add step",
  "Total quest": "Total quests",
  Dipublikasikan: "Published",
  Draf: "Draft",
  "Quest baru": "New quest",
  "menit · 50 XP": "minutes · 50 XP",
  "SEDIKIT, TAPI KONSISTEN": "A LITTLE, OFTEN",
  "Misi hari ini": "Today’s missions",
  "Langkah kecilmu tetap berarti.": "Small steps still count.",
  "Pilih yang paling mendekati perasaanmu. Semua perasaan boleh hadir.":
    "Choose what feels closest. Every feeling has a place here.",
  "Tiga cara untuk hadir": "Three ways to show up",
  poin: "Poin",
  Diambil: "Claimed",
  "Satu hal yang kamu syukuri hari ini": "One thing you appreciate today",
  "Simpan refleksi": "Save reflection",
  "Aksi 24 jam": "Your next 24 hours",
  "Siapkan dua aksi kecil untuk kondisi finansialmu.":
    "Choose two small steps for your finances.",
  "Buat rencana": "Make a plan",
  "Komitmen jangka panjang": "A longer-term commitment",
  Minggu: "Week",
  "Pengingat mingguan muncul setelah menyelesaikan Komitmen 90 Hari.":
    "Weekly reminders appear after you complete the 90-day commitment.",
  "Target:": "Target:",
  "Surat untuk dirimu di masa depan": "A letter to your future self",
  "Tujuh hari tanpa layar di zonamu": "Seven screen-free days in your space",
  Hari: "Day",
  "CERITA YANG TERUS TUMBUH": "YOUR STORY, STILL GROWING",
  "Potongan kecil perjalananmu, dalam satu tempat.":
    "Your small steps, gathered in one place.",
  "BLUEPRINT MILIK": "A BLUEPRINT FOR",
  "quest selesai": "quests completed",
  "Jejak pencapaian": "Your milestones",
  "Selesaikan quest pertamamu untuk mendapatkan lencana.":
    "Complete your first quest to earn a badge.",
  "Buka kembali": "Revisit",
  "Unduh kontrak PDF": "Download commitment PDF",
  "Kartu afirmasi": "Affirmation card",
  "Belum ada refleksi. Mulai saat kamu siap.":
    "No reflections yet. Start when you’re ready.",
  "Bawa perjalananmu": "Take your journey with you",
  "Sertakan isi refleksi pribadi dalam PDF":
    "Include private reflections in the PDF",
  "Secara default, ekspor hanya berisi progres dan pencapaian.":
    "By default, the export includes only progress and achievements.",
  "Unduh Life Blueprint": "Download Life Blueprint",
  "HADIAH UNTUK LANGKAH KECIL": "SOMETHING FOR YOUR SMALL STEPS",
  "Toko Tarsy": "Tarsy shop",
  "Gunakan Poin yang kamu dapatkan dari misi.":
    "Use the Poin you’ve earned from missions.",
  "Didapat dari progres, tanpa pembayaran.":
    "Earned through progress. No payment required.",
  "Jaga streak ketika kamu perlu satu hari jeda. Maksimal dua tersimpan.":
    "Keep your streak when you need a day off. Store up to two.",
  "Dimiliki:": "Owned:",
  "20 poin": "20 Poin",
  "Aura Penjelajah": "Explorer aura",
  "Cahaya keemasan untuk menemani Tarsy di perjalananmu.":
    "A golden glow to accompany Tarsy on your journey.",
  "Kosmetik permanen": "Permanent cosmetic",
  Dimiliki: "Owned",
  "35 poin": "35 Poin",
  "TUMBUH BARENG, TANPA BANDING-BANDING": "GROW TOGETHER AT YOUR OWN PACE",
  "Ruang Bersama": "Shared space",
  "Sedikit teman, lebih banyak dukungan.":
    "A few companions. A little more support.",
  "Squad dan liga membutuhkan akun Supabase yang tersambung. Progres perangkatmu tetap bisa digunakan; tidak ada anggota atau peringkat fiktif.":
    "Connect an account to use squads. Your device progress remains available.",
  "Squad kecilmu": "Your small squad",
  "Maks. 6 orang": "Up to 6 people",
  dukungan: "encouragements",
  "Beri kudos": "Send kudos",
  "Maksimal 5 kudos per hari. Isi jurnal tidak dibagikan.":
    "Up to 5 kudos a day. Journals are never shared.",
  "Keluar squad": "Leave squad",
  "Buat squad": "Create squad",
  "Punya kode undangan?": "Have an invite code?",
  "Gabung squad": "Join squad",
  "REFLEKSI MINGGU INI": "THIS WEEK’S REFLECTION",
  "Hal kecil apa yang membuatmu merasa didukung?":
    "What small thing helped you feel supported?",
  "Bagikan ke squad": "Share with squad",
  "Progres squad": "Squad progress",
  "Saling mendukung melalui langkah kecil. Liga lintas-squad belum diaktifkan pada revamp ini.":
    "Support one another through small steps. Cross-squad leagues are not enabled.",
  "XP minggumu:": "Your weekly XP:",
  "Total alokasi:": "Total allocation:",
  "Sesuaikan hingga total 100%.": "Adjust the total to 100%.",
  "Progres terhadap target": "Progress toward your target",
  "Perbandingan terhadap target pribadimu, bukan penilaian kesehatan finansial.":
    "A comparison with your own target, not a financial health assessment.",
  "Proyeksi ilustratif": "Illustrative projection",
  tahun: "years",
  "Distribusi 24 jammu": "How your 24 hours add up",
  jam: "hours",
  "Kecenderungan:": "Tendency:",
  "Gaya dapat berubah menurut situasi.":
    "Your style may change with the situation.",
  "“Aku merasa": "“I feel",
  ketika: "when",
  ". Aku membutuhkan": ". I need",
  ". Bisakah kita": ". Could we",
  "TARSIO · CATATAN UNTUK DIRI": "TARSIO · A NOTE TO YOURSELF",
  "SATU LANGKAH LEBIH DEKAT": "ONE SMALL STEP FORWARD",
  "Kamu sudah hadir": "You made time",
  "untuk dirimu.": "for yourself.",
  "selesai. Refleksimu tersimpan di Life Blueprint.":
    "complete. Your reflection is saved in Life Blueprint.",
  "Quest selesai": "Quest complete",
  "Lanjutkan perjalanan": "Continue your journey",
  "· LANGKAH": "· STEP",
  "Refleksi ini hanya untukmu.": "This reflection is just for you.",
  Kembali: "Back",
  "KENALAN DULU, YUK ·": "LET’S GET TO KNOW YOU ·",
  "Aku Tarsy.": "I’m Tarsy.",
  "Panggil kamu siapa?": "What should I call you?",
  "Kita mulai pelan-pelan, sesuai ritmemu.":
    "We’ll start gently, at your own pace.",
  "Bagaimana kabarmu": "How have you been",
  "akhir-akhir ini?": "feeling lately?",
  "Mulai dari yang": "Start with what",
  "paling kamu butuhkan.": "you need most.",
  "Berapa menit": "How much time",
  "untuk dirimu?": "would you like for yourself?",
  "menit / hari": "minutes / day",
  "Apa yang ingin": "How would you",
  "kamu rasakan?": "like to feel?",
  "Bukan target besar. Cukup satu alasan untuk kembali.":
    "No big target needed. Just a reason to return.",
  "Refleksimu privat. Tidak ada jawaban benar atau salah.":
    "Your reflections are private. There are no right or wrong answers.",
  Nama: "Name",
  "Kata sandi (minimal 8 karakter)": "Password (at least 8 characters)",
  "Buat akun": "Create account",
  Masuk: "Sign in",
  "Lupa kata sandi?": "Forgot password?",
  "Mode perangkat dan akun online memiliki penyimpanan terpisah.":
    "Device mode and online accounts use separate storage.",
  "Energi & Batasan": "Energy & boundaries",
  "Fondasi Finansial": "Financial foundations",
  "Mengenal Diri": "Understanding yourself",
  "Kesehatan & Pemulihan": "Health & recovery",
  "Karier & Tujuan": "Career & purpose",
  "Komunikasi & Konflik": "Communication & conflict",
  "Kebiasaan & Produktivitas": "Habits & productivity",
  "Penuh semangat": "Energized",
  "Butuh jeda": "Need a pause",
  "Banyak pikiran": "A lot on my mind",
  "Sedang mencari arah": "Finding my direction",
  "Menyimpan…": "Saving…",
  "Mulai perjalananku": "Start my journey",
  Lanjut: "Continue",
  "Langkah ringan": "A gentle step",
  "Ruang bertumbuh": "Room to grow",
  "Jeda lebih panjang": "A longer pause",
  "Simpan perubahan": "Save changes",
  Tutup: "Close",
  Terbit: "Published",
  "Draf tersimpan": "Draft saved",
  "Latihan ulang": "Practice again",
  "Selesaikan quest": "Complete quest",
  Perjalanan: "Journey",
  Jelajahi: "Explore",
  "Ruang bersama": "Shared space",
};
export function copy(text: string, locale: Locale) {
  return locale === "en" ? english[text] || text : text;
}
export function Copy({ text }: { text: string }) {
  return <>{copy(text, useContext(LanguageContext))} </>;
}
export function useCopy() {
  const locale = useContext(LanguageContext);
  return (text: string) => copy(text, locale);
}
