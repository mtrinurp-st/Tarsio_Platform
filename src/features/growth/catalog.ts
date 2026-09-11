export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "range"
  | "choice"
  | "multi"
  | "check"
  | "date";
export type Field = {
  id: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  hint?: string;
};
export type Step = {
  title: string;
  hint: string;
  fields: Field[];
  widget?:
    | "energy"
    | "finance"
    | "budget"
    | "compound"
    | "breathing"
    | "reframe"
    | "time"
    | "communication"
    | "script"
    | "contract";
};
export type Lesson = {
  id: string;
  unit: number;
  title: string;
  description: string;
  minutes: number;
  published: boolean;
  steps: Step[];
};
export type Unit = {
  id: number;
  title: string;
  short: string;
  description: string;
  color: string;
  icon: string;
  badge: string;
};
export const units: Unit[] = [
  {
    id: 1,
    title: "Energi & Batasan",
    short: "Energi",
    description: "Kenali yang mengisi energimu. Beri ruang untuk dirimu.",
    color: "#a86b24",
    icon: "Sun",
    badge: "Boundary Setter",
  },
  {
    id: 2,
    title: "Fondasi Finansial",
    short: "Finansial",
    description: "Bangun hubungan yang lebih tenang dengan uang.",
    color: "#248477",
    icon: "Wallet",
    badge: "Financial Clarity",
  },
  {
    id: 3,
    title: "Mengenal Diri",
    short: "Identitas",
    description: "Temukan nilai diri, di luar ekspektasi orang lain.",
    color: "#7c62aa",
    icon: "Sprout",
    badge: "Storyteller",
  },
  {
    id: 4,
    title: "Kesehatan & Pemulihan",
    short: "Pemulihan",
    description: "Istirahat juga bagian dari perjalanan.",
    color: "#387da4",
    icon: "Heart",
    badge: "Recovery Keeper",
  },
  {
    id: 5,
    title: "Karier & Tujuan",
    short: "Karier",
    description: "Buat langkah kerja yang selaras dengan nilai hidupmu.",
    color: "#ba603b",
    icon: "Compass",
    badge: "Purpose Explorer",
  },
  {
    id: 6,
    title: "Komunikasi & Konflik",
    short: "Komunikasi",
    description: "Sampaikan kebutuhanmu dengan jujur dan hangat.",
    color: "#ad5580",
    icon: "MessagesSquare",
    badge: "Clear Communicator",
  },
  {
    id: 7,
    title: "Kebiasaan & Produktivitas",
    short: "Kebiasaan",
    description: "Kecil, realistis, dan bisa kamu ulangi.",
    color: "#598143",
    icon: "Repeat",
    badge: "Habit Builder",
  },
];
const f = (
  id: string,
  label: string,
  kind: FieldKind = "textarea",
  extra: Partial<Field> = {},
): Field => ({ id, label, kind, required: true, ...extra });
const step = (
  title: string,
  hint: string,
  fields: Field[],
  widget?: Step["widget"],
): Step => ({ title, hint, fields, widget });
const lesson = (
  id: string,
  unit: number,
  title: string,
  description: string,
  steps: Step[],
  minutes = 5,
): Lesson => ({
  id,
  unit,
  title,
  description,
  minutes,
  published: true,
  steps,
});
const areas = [
  "Fisik",
  "Emosional",
  "Intelektual",
  "Sosial",
  "Spiritual",
  "Finansial",
];
export const lessons: Lesson[] = [
  lesson(
    "1-1",
    1,
    "Peta Energi",
    "Cari tahu hal kecil yang membuatmu merasa lebih hidup.",
    [
      step(
        "Apa yang mengisi energimu?",
        "Pilih satu aktivitas untuk setiap area. Tidak perlu jawaban yang sempurna.",
        areas.map((a, i) => f("energy" + i, a)),
        "energy",
      ),
      step(
        "Seberapa besar dampaknya?",
        "Nilai dari 1 (sedikit) sampai 10 (sangat terasa).",
        areas.map((a, i) => f("impact" + i, a, "range", { min: 1, max: 10 })),
      ),
      step(
        "Satu janji baik untuk dirimu",
        "Lengkapi kalimat ini dengan cara yang terasa realistis.",
        [
          f("tired", "Saat aku lelah karena…"),
          f("kindness", "Aku akan… untuk diriku sendiri"),
        ],
      ),
    ],
  ),
  lesson(
    "1-2",
    1,
    "Audit Hubungan",
    "Lihat relasimu dengan lebih jernih, tanpa menghakimi.",
    [
      "Pasangan / ketertarikan",
      "Teman dekat",
      "Keluarga inti",
      "Kerja / studi",
      "Diri sendiri",
    ].map((a, i) =>
      step(
        a,
        "Jika kategori ini tidak relevan, kamu boleh menuliskan “tidak relevan”.",
        [
          f("rating" + i, "Kualitas hubungan", "range", { min: 1, max: 5 }),
          f("note" + i, "Apa yang kamu rasakan?"),
          f("decision" + i, "Yang ingin kamu lakukan", "multi", {
            options: ["Kurangi", "Ubah", "Pertahankan"],
          }),
          f("action" + i, "Satu langkah kecil minggu ini"),
        ],
      ),
    ),
  ),
  lesson(
    "1-3",
    1,
    "Kontrak Batasan Diri",
    "Ubah kebutuhanmu menjadi batasan yang bisa dikomunikasikan.",
    [
      ...[
        "Privasi & me-time",
        "Batasan finansial",
        "Komentar & kritik",
        "Permintaan bantuan",
      ].map((a, i) =>
        step(
          a,
          "Batasan mengatur tindakanmu, bukan mengendalikan orang lain.",
          [
            f("boundary" + i, "Batasan yang kubutuhkan"),
            f("consequence" + i, "Jika terlewati, aku akan…"),
            f("assertive" + i, "Kalimat yang akan kusampaikan", "textarea", {
              hint: [
                "Aku butuh waktu sendiri malam ini. Kita bicara besok, ya.",
                "Aku belum bisa meminjamkan uang saat ini.",
                "Aku terbuka pada masukan yang disampaikan dengan hormat.",
                "Aku bisa membantu selama 30 menit, setelah itu aku perlu berhenti.",
              ][i],
            }),
          ],
        ),
      ),
      step(
        "Kontrak untuk diriku",
        "Kesepakatan ini boleh berubah saat kebutuhanmu berubah.",
        [
          f("workHours", "Jam kerja / belajar"),
          f("physical", "Batas fisik"),
          f("emotional", "Batas emosional"),
          f("recharge", "Janji recharge"),
        ],
      ),
      step(
        "Tanda tangani komitmenmu",
        "Nama yang diketik adalah alternatif tanda tangan yang aksesibel.",
        [
          f("signature", "Nama lengkap", "text"),
          f(
            "consent",
            "Aku berkomitmen mencoba batasan ini dengan penuh kasih.",
            "check",
          ),
        ],
        "contract",
      ),
    ],
    8,
  ),
  lesson(
    "2-1",
    2,
    "Peta Finansial",
    "Mulai dari angka yang nyata, sekecil apa pun.",
    [
      step(
        "Posisimu hari ini",
        "Isi nominal rupiah. Nol juga jawaban yang valid.",
        [
          "Dana darurat",
          "Utang konsumtif",
          "Pengeluaran bulanan",
          "Investasi bulanan",
          "Premi proteksi bulanan",
        ].map((a, i) => f("money" + i, a, "number", { min: 0 })),
      ),
      step(
        "Tentukan targetmu",
        "Dana darurat, investasi, dan proteksi adalah target minimum. Utang dan pengeluaran adalah batas maksimum.",
        [
          "Dana darurat",
          "Utang maksimum",
          "Pengeluaran maksimum",
          "Investasi bulanan",
          "Premi proteksi bulanan",
        ].map((a, i) => f("target" + i, a, "number", { min: 0 })),
        "finance",
      ),
    ],
  ),
  lesson(
    "2-2",
    2,
    "Rencana Aksi 24 Jam",
    "Dua langkah kecil lebih berarti daripada rencana sempurna.",
    [
      step(
        "Apa yang bisa dilakukan besok?",
        "Isi minimal dua area. Timer dimulai saat quest diselesaikan.",
        [
          "Penghasilan",
          "Utang",
          "Pengeluaran",
          "Dana darurat",
          "Investasi",
          "Proteksi",
        ].map((a, i) => f("action" + i, a, "textarea", { required: false })),
      ),
      step(
        "Siapkan ruang untuk melakukannya",
        "Pilih waktu yang sungguh bisa kamu sisihkan.",
        [
          f("when", "Kapan akan kamu mulai?", "text"),
          f("obstacle", "Hambatan yang mungkin muncul"),
          f("support", "Cara mengatasinya"),
        ],
      ),
    ],
  ),
  lesson(
    "2-3",
    2,
    "Komitmen 90 Hari",
    "Buat sistem yang bisa bertahan, bukan sekadar semangat.",
    [
      step(
        "Cek kesiapanmu",
        "“Belum” membantu kita menentukan langkah berikutnya.",
        [
          "Aku tahu pengeluaran bulananku",
          "Aku punya rencana dana darurat",
          "Aku memahami utangku",
          "Aku sudah meninjau proteksiku",
        ].map((a, i) =>
          f("ready" + i, a, "choice", { options: ["Sudah", "Belum"] }),
        ),
      ),
      step(
        "Bagi anggaranmu",
        "Atur persentase hingga totalnya 100%. Angka 50/30/20 hanya titik awal.",
        [
          f("needs", "Kebutuhan (%)", "range", { min: 0, max: 100 }),
          f("wants", "Keinginan (%)", "range", { min: 0, max: 100 }),
          f("saving", "Tabungan & investasi (%)", "range", {
            min: 0,
            max: 100,
          }),
          f("insurance", "Target proteksi (Rp)", "number", { min: 0 }),
          f("investment", "Target investasi bulanan (Rp)", "number", {
            min: 0,
          }),
        ],
        "budget",
      ),
      step(
        "Kembali setiap minggu",
        "Check-in mingguan akan muncul di halaman Misi selama 90 hari.",
        [
          f("commitment", "Alasan aku ingin konsisten"),
          f("remind", "Aktifkan pengingat check-in di aplikasi", "check", {
            required: false,
          }),
        ],
      ),
    ],
    7,
  ),
  lesson(
    "2-4",
    2,
    "Simulator Konsistensi",
    "Lihat bagaimana kebiasaan menabung dapat bertumbuh.",
    [
      step(
        "Kalau aku konsisten…",
        "Simulasi ilustratif, bukan nasihat investasi. Hasil tidak dijamin; belum memperhitungkan pajak, biaya, dan inflasi.",
        [
          f("monthly", "Investasi bulanan (Rp)", "number", { min: 0 }),
          f("initial", "Saldo awal (Rp)", "number", { min: 0 }),
          f("rate", "Asumsi imbal hasil tahunan (%)", "range", {
            min: 0,
            max: 15,
          }),
        ],
        "compound",
      ),
      step("Ambil maknanya", "Fokus pada hal yang bisa kamu kendalikan.", [
        f("takeaway", "Apa yang bisa kamu mulai bulan ini?"),
      ]),
    ],
  ),
  lesson(
    "3-1",
    3,
    "Peta Diri & Pemulihan",
    "Beri tempat untuk kekuatan dan kebutuhanmu.",
    [
      step(
        "Empat sisi dirimu",
        "Tulis satu contoh konkret di setiap bagian.",
        [
          "Pola pikir yang mendukung",
          "Batasan yang ditegakkan",
          "Aksi menghargai diri",
          "Nilai diriku, tanpa pencapaian",
        ].map((a, i) => f("quadrant" + i, a)),
      ),
      step(
        "Jeda sejenak",
        "Bernapas normal jika pola ini tidak nyaman. Kamu bisa berhenti kapan saja.",
        [
          f("recovery", "Apa yang kamu butuhkan?", "multi", {
            options: [
              "Tidur",
              "Batasan digital",
              "Pemulihan fisik",
              "Ruang emosional",
            ],
          }),
          f("feeling", "Bagaimana rasanya setelah jeda?"),
        ],
        "breathing",
      ),
    ],
  ),
  lesson(
    "3-2",
    3,
    "Akar Harga Diri",
    "Kamu lebih besar dari satu masa sulit.",
    [
      step(
        "Satu masa yang tidak mudah",
        "Tulislah hanya yang nyaman kamu ceritakan.",
        [f("struggle", "Momen yang menantang dan bagaimana aku menjalaninya")],
      ),
      step("Menarik garis", "Kebutuhanmu layak mendapat ruang.", [
        f("line", "Satu batasan yang ingin kujaga"),
      ]),
      step(
        "Surat untuk diriku yang berusia 15",
        "Bayangkan kamu sedang berbicara kepada seorang teman.",
        [
          f(
            "letter",
            "Hal yang ingin kusampaikan kepada diriku yang lebih muda",
          ),
          f(
            "future",
            "Tampilkan surat ini lagi enam bulan mendatang",
            "check",
            { required: false },
          ),
        ],
      ),
    ],
  ),
  lesson(
    "3-3",
    3,
    "Menulis Ulang Keyakinan",
    "Cari narasi yang lebih adil untuk dirimu.",
    [
      ...[0, 1].map((i) =>
        step(
          "Keyakinan " + (i + 1),
          "Bukti tandingan boleh berupa hal sederhana yang pernah kamu lakukan.",
          [
            f("belief" + i, "Keyakinan yang membatasi"),
            f("evidence" + i, "Bukti yang menantangnya"),
            f("narrative" + i, "Narasi baru yang lebih adil"),
          ],
        ),
      ),
      step(
        "Bawa satu kalimat ini",
        "Afirmasi dapat diunduh dari Life Blueprint. Jurnal tetap privat.",
        [f("affirmation", "Afirmasi pilihanku")],
        "reframe",
      ),
    ],
  ),
  lesson(
    "4-1",
    4,
    "Baseline Tidur & Energi",
    "Kenali pola, tanpa mengejar skor sempurna.",
    [
      step("Bagaimana tidurmu?", "Ingat rata-rata satu minggu terakhir.", [
        f("quality", "Kualitas tidur", "range", { min: 1, max: 10 }),
        f("hours", "Rata-rata jam tidur", "number", { min: 0, max: 24 }),
        f("disruptors", "Hal yang mengganggu tidur", "multi", {
          options: [
            "Layar sebelum tidur",
            "Kafein sore / malam",
            "Pikiran yang penuh",
            "Jadwal tidak teratur",
            "Lingkungan tidur",
            "Tidak ada",
          ],
        }),
      ]),
      step(
        "Satu perubahan ringan",
        "Mulai dengan eksperimen kecil selama seminggu.",
        [f("sleepAction", "Yang akan kucoba malam ini")],
      ),
    ],
  ),
  lesson(
    "4-2",
    4,
    "Rencana Digital Detox",
    "Ciptakan ruang tanpa layar yang masuk akal.",
    [
      step(
        "Zona bebas ponsel",
        "Tentukan dua tempat atau waktu yang ingin kamu lindungi.",
        [
          f("zone0", "Zona pertama", "text"),
          f("zone1", "Zona kedua", "text"),
          f("zone2", "Zona ketiga (opsional)", "text", { required: false }),
        ],
      ),
      step(
        "Coba selama seminggu",
        "Lacak harimu di halaman Misi setelah quest selesai.",
        [
          f("replacement", "Aktivitas pengganti saat ingin membuka ponsel"),
          f(
            "detoxCommit",
            "Aku siap mencoba, tanpa menuntut kesempurnaan.",
            "check",
          ),
        ],
      ),
    ],
  ),
  lesson(
    "4-3",
    4,
    "Check-In Tubuh",
    "Dengarkan tubuhmu sebelum melanjutkan hari.",
    [
      step(
        "Bagian mana yang terasa tegang?",
        "Pilih lewat tombol. Ini latihan kesadaran, bukan diagnosis.",
        [
          f("tense", "Area tegang", "multi", {
            options: [
              "Kepala",
              "Leher",
              "Bahu",
              "Punggung",
              "Tangan",
              "Kaki",
              "Tidak ada",
            ],
          }),
          f("comfortable", "Area yang terasa nyaman", "text"),
          f("bodyNote", "Apa yang dibutuhkan tubuhmu?"),
        ],
      ),
      step(
        "Gerak ringan, sesuai kemampuan",
        "Coba putar bahu perlahan atau berdiri sebentar. Hentikan jika terasa sakit. Ini bukan saran medis.",
        [f("bodyAction", "Gerakan atau jeda yang kupilih")],
      ),
    ],
  ),
  lesson(
    "5-1",
    5,
    "Peta Skill & Minat",
    "Hubungkan yang kamu bisa dengan yang ingin kamu pelajari.",
    [
      ...[0, 1, 2].map((i) =>
        step(
          "Skill " + (i + 1),
          "Skill teknis, komunikasi, atau organisasi sama-sama berarti.",
          [
            f("skill" + i, "Skill saat ini", "text"),
            f("level" + i, "Tingkat penguasaan", "choice", {
              options: ["Baru mulai", "Cukup mandiri", "Berpengalaman"],
            }),
            f("desired" + i, "Skill yang ingin dikembangkan", "text"),
          ],
        ),
      ),
    ],
  ),
  lesson(
    "5-2",
    5,
    "Audit Nilai Kerja",
    "Apa yang paling kamu butuhkan dari pekerjaan?",
    [
      ...[
        "Otonomi",
        "Stabilitas",
        "Dampak",
        "Kreativitas",
        "Pendapatan",
        "Relasi",
      ].map((a, i) =>
        step(a, "Bandingkan kebutuhanmu dengan situasi saat ini.", [
          f("importance" + i, "Seberapa penting?", "range", { min: 1, max: 5 }),
          f("reality" + i, "Terpenuhi saat ini?", "range", { min: 1, max: 5 }),
        ]),
      ),
      step(
        "Temukan prioritas",
        "Mulai dari satu kesenjangan yang bisa kamu pengaruhi.",
        [
          f(
            "workPriority",
            "Nilai yang akan kuprioritaskan dan satu langkahnya",
          ),
        ],
      ),
    ],
  ),
  lesson(
    "5-3",
    5,
    "Satu Langkah Karier",
    "Ubah arah besar menjadi satu aksi 30 hari.",
    [
      step(
        "Pilih satu hasil yang jelas",
        "Contoh: menyelesaikan satu proyek portofolio.",
        [
          f("careerAction", "Aksi 30 hariku"),
          f("success", "Aku tahu ini selesai ketika…"),
          f("due", "Tanggal target", "date"),
        ],
      ),
      step(
        "Buat langkah pertama mudah",
        "Pengingat tindak lanjut muncul di halaman Misi.",
        [
          f("firstStep", "Langkah 15 menit yang bisa kulakukan hari ini"),
          f("careerReminder", "Aktifkan check-in 30 hari", "check", {
            required: false,
          }),
        ],
      ),
    ],
  ),
  lesson(
    "6-1",
    6,
    "Gaya Komunikasiku",
    "Amati kebiasaanmu, bukan memberi label permanen.",
    [
      ...[
        "Saat pendapatku berbeda",
        "Ketika batasanku dilanggar",
        "Saat diminta membantu padahal sibuk",
        "Ketika menerima kritik",
        "Saat kecewa pada teman",
        "Ketika butuh bantuan",
        "Saat ada kesalahpahaman",
        "Ketika ingin berkata tidak",
      ].map((a, i) =>
        step(a, "Pilih respons yang paling sering muncul.", [
          f("style" + i, "Biasanya aku…", "choice", {
            options: [
              "Menyampaikan kebutuhan dengan jelas dan menghargai orang lain",
              "Diam dan mengalah meski tidak nyaman",
              "Memaksakan pendapat agar diikuti",
              "Setuju di depan tetapi menyindir kemudian",
            ],
          }),
        ]),
      ),
      step(
        "Gaya bisa dipelajari",
        "Hasil ini bersifat reflektif dan bukan asesmen psikologis.",
        [f("communicationAction", "Satu respons yang ingin kulatih")],
        "communication",
      ),
    ],
    7,
  ),
  lesson(
    "6-2",
    6,
    "Skrip Percakapan Sulit",
    "Jujur tentang perasaan, jelas tentang kebutuhan.",
    [
      step(
        "Apa yang ingin dibicarakan?",
        "Pisahkan kejadian yang terlihat dari asumsi.",
        [
          f("situation", "Situasi yang terjadi"),
          f("feeling", "Aku merasa…", "text"),
          f("when", "Ketika…"),
          f("need", "Aku membutuhkan…"),
          f("request", "Permintaan konkretku…"),
        ],
        "script",
      ),
      step("Sebelum memulai", "Pilih waktu saat kedua pihak cukup tenang.", [
        f("conversationWhen", "Waktu dan tempat untuk berbicara", "text"),
      ]),
    ],
  ),
  lesson(
    "6-3",
    6,
    "Latihan Respons Asertif",
    "Latihan kecil sebelum percakapan nyata.",
    [
      step("Pilih situasi", "Tuliskan responsmu sebelum melihat contoh.", [
        f("scenario", "Situasi", "choice", {
          options: [
            "Rekan memberi tugas di luar jam kerja",
            "Teman terus meminjam uang",
            "Keluarga mengomentari pilihan karier",
          ],
        }),
        f("response", "Respons yang ingin kusampaikan"),
      ]),
      step(
        "Bandingkan dengan contoh",
        "“Aku bisa mengerjakannya besok saat jam kerja.” / “Aku belum bisa meminjamkan uang.” / “Aku menghargai perhatianmu, tetapi keputusan ini ingin kuambil sendiri.”",
        [f("rewrite", "Respons yang sudah kuperbaiki")],
      ),
    ],
  ),
  lesson(
    "7-1",
    7,
    "Audit Waktu 24 Jam",
    "Lihat ke mana waktumu pergi, tanpa menghakimi.",
    [
      step(
        "Petakan hari kemarin",
        "Setiap kotak mewakili satu jam. Boleh perkiraan.",
        Array.from({ length: 24 }, (_, i) =>
          f("hour" + i, String(i).padStart(2, "0") + ":00", "choice", {
            options: [
              "Tidur",
              "Kerja",
              "Istirahat",
              "Layar",
              "Sosial",
              "Perawatan diri",
            ],
          }),
        ),
        "time",
      ),
      step("Apa yang ingin diubah?", "Istirahat bukan waktu yang terbuang.", [
        f("timeChange", "Satu perubahan alokasi waktu yang realistis"),
      ]),
    ],
    7,
  ),
  lesson(
    "7-2",
    7,
    "Habit Stack Builder",
    "Tempelkan kebiasaan baru pada rutinitas yang sudah ada.",
    [
      ...[0, 1, 2].map((i) =>
        step(
          "Rangkaian " + (i + 1) + (i ? " (opsional)" : ""),
          "Buat kebiasaan baru sesingkat dua menit.",
          [
            f("after" + i, "Setelah aku…", "text", { required: i === 0 }),
            f("habit" + i, "Aku akan…", "text", { required: i === 0 }),
          ],
        ),
      ),
    ],
  ),
  lesson(
    "7-3",
    7,
    "Ritual Review Mingguan",
    "Luangkan waktu untuk melihat sejauh apa kamu berjalan.",
    [
      step(
        "Rayakan yang sudah ada",
        "Statistik minggu ini tersedia di ringkasan perjalananmu.",
        [
          f("wins", "Apa yang berjalan baik?"),
          f("challenge", "Apa yang terasa sulit?"),
        ],
      ),
      step("Belajar dan lanjutkan", "Kamu boleh menyesuaikan target.", [
        f("learned", "Apa yang kupelajari tentang diriku?"),
        f("release", "Apa yang ingin kulepaskan?"),
        f("nextWeek", "Satu prioritas untuk minggu depan"),
      ]),
    ],
  ),
];
export type Answers = Record<string, string | number | boolean | string[]>;
export function validateStep(
  lesson: Lesson,
  index: number,
  answers: Answers,
): string | null {
  const s = lesson.steps[index];
  for (const field of s.fields) {
    const v = answers[field.id];
    if (
      field.required &&
      (v === undefined ||
        v === "" ||
        (typeof v === "string" && !v.trim()) ||
        (Array.isArray(v) && !v.length) ||
        (field.kind === "check" && v !== true))
    )
      return "Lengkapi “" + field.label + "” terlebih dahulu.";
    if (
      (field.kind === "number" || field.kind === "range") &&
      v !== undefined &&
      v !== ""
    ) {
      const n = Number(v);
      if (
        !Number.isFinite(n) ||
        (field.min !== undefined && n < field.min) ||
        (field.max !== undefined && n > field.max)
      )
        return "Periksa nilai “" + field.label + "”.";
    }
    if (
      field.options &&
      v !== undefined &&
      v !== "" &&
      !(Array.isArray(v)
        ? v.every((x) => field.options!.includes(x))
        : field.options.includes(String(v)))
    )
      return "Pilihan tidak valid.";
  }
  if (
    lesson.id === "2-2" &&
    index === 0 &&
    s.fields.filter((f) => String(answers[f.id] ?? "").trim()).length < 2
  )
    return "Isi minimal dua rencana aksi.";
  if (
    s.widget === "budget" &&
    Number(answers.needs) + Number(answers.wants) + Number(answers.saving) !==
      100
  )
    return "Total alokasi anggaran harus 100%.";
  if (
    lesson.id === "7-2" &&
    Boolean(answers["after" + index]) !== Boolean(answers["habit" + index])
  )
    return "Lengkapi pasangan kebiasaan, atau kosongkan keduanya.";
  return null;
}
