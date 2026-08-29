/**
 * 発言者の肖像。1問打ち終わったあとの画面(RevealScreen)で出す。
 *
 * ★このファイルは scripts/fetch-portraits.py が生成する。手で書き換えないこと。
 *   人物を足したら fetch-portraits.py の WIKI に1行足して再実行する。
 *
 * キーは Quote.authorEn。肖像は「名言の属性」ではなく「人物の属性」なので、
 * ここを Quote 型と切り離しておくと、名言データ側に一切手を入れずに済む
 * (同じ人物の複数の名言で自然に共有される)。
 *
 * 画像は Wikimedia Commons から取得し、128x128 にトリミングした改変物。
 * license が Public domain / CC0 以外のものは表示義務があるので、
 * CreditsScreen に必ず出す(検証は scripts/validate-quotes.ts が行う)。
 */
export interface Portrait {
  /** public/portraits/ 配下のファイル名 */
  file: string;
  /** 作者・撮影者 */
  credit: string;
  /** "Public domain" / "CC BY-SA 3.0" など */
  license: string;
  /** Commons のファイルページ */
  sourceUrl: string;
}

export const PORTRAITS: Record<string, Portrait> = {
  "Abraham Lincoln": {
    file: "abraham-lincoln.webp",
    credit: "Alexander Gardner",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Abraham_Lincoln_1863_Portrait_(3x4_cropped).jpg",
  },
  "Albert Einstein": {
    file: "albert-einstein.webp",
    credit: "Oren Jack Turner",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Albert_Einstein_Head_cleaned.jpg",
  },
  "Anne Frank": {
    file: "anne-frank.webp",
    credit: "Unknown photographer",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Anne_Frank_passport_photo,_May_1942_(cropped).jpg",
  },
  "Aristotle": {
    file: "aristotle.webp",
    credit: "After Lysippos",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aristotle_Altemps_Inv8575.jpg",
  },
  "Benjamin Franklin": {
    file: "benjamin-franklin.webp",
    credit: "Joseph-Siffred Duplessis",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Joseph_Siffrein_Duplessis_-_Benjamin_Franklin_-_Google_Art_Project.jpg",
  },
  "Buddha": {
    file: "buddha.webp",
    credit: "พระมหาเทวประภาส วชิรญาณเมธี (ผู้ถ่าย-ปล่อยสัญญาอนุญาตภาพให้นำไปใช้ได้เพื่อการศึกษาโดยอยู่ภ",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Buddha_in_Sarnath_Museum_(Dhammajak_Mutra).jpg",
  },
  "Charles Darwin": {
    file: "charles-darwin.webp",
    credit: "Charles_Darwin_seated.jpg: Henry Maull (1829–1914) and John Fox (1832–1907) (Maull &amp; F",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Charles_Darwin_seated_crop.jpg",
  },
  "Confucius": {
    file: "confucius.webp",
    credit: "Wu Daozi, 685-758, Tang Dynasty.",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Confucius_Tang_Dynasty.jpg",
  },
  "Dalai Lama XIV": {
    file: "dalai-lama-xiv.webp",
    credit: "Christopher Michel",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:The_Dalai_Lama_in_2012.jpg",
  },
  "Eiichi Shibusawa": {
    file: "eiichi-shibusawa.webp",
    credit: "Unknown photographer",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Portrait_of_Shibusawa_Eiichi.jpg",
  },
  "Eleanor Roosevelt": {
    file: "eleanor-roosevelt.webp",
    credit: "FDR Presidential Library &amp; Museum",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Eleanor_Roosevelt_at_the_United_Nations,_circa_1946-1947_(3x4_cropped).jpg",
  },
  "Epictetus": {
    file: "epictetus.webp",
    credit: "Claude Reydellet, engraving by S. Beyssent",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Epictetus.png",
  },
  "Florence Nightingale": {
    file: "florence-nightingale.webp",
    credit: "Henry Hering (1814-1893)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Florence_Nightingale_(H_Hering_NPG_x82368).jpg",
  },
  "Franklin D. Roosevelt": {
    file: "franklin-d-roosevelt.webp",
    credit: "Leon Perskie",
    license: "CC BY 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:FDR-1944-Campaign-Portrait_(3x4_retouched,_cropped).jpg",
  },
  "Friedrich Nietzsche": {
    file: "friedrich-nietzsche.webp",
    credit: "Friedrich Hermann Hartmann",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Nietzsche187a.jpg",
  },
  "Galileo Galilei": {
    file: "galileo-galilei.webp",
    credit: "Justus Sustermans",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Galileo_Galilei_(1564-1642)_RMG_BHC2700.tiff",
  },
  "Helen Keller": {
    file: "helen-keller.webp",
    credit: "Unknown authorUnknown author",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Helen_Keller_(circa_1904).jpg",
  },
  "Henry Ford": {
    file: "henry-ford.webp",
    credit: "Ford Motor Company. Photographic Department",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Henry_Ford_portrait_1915_original_(3x4_cropped).png",
  },
  "Hideyo Noguchi": {
    file: "hideyo-noguchi.webp",
    credit: "Unknown authorUnknown author",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Noguchi_Hideyo.jpg",
  },
  "Hideyoshi Toyotomi": {
    file: "hideyoshi-toyotomi.webp",
    credit: "Kanō Mitsunobu (狩野 光信, 1565–1608)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Toyotomi_Hideyoshi_c1598_Kodai-ji_Temple.png",
  },
  "Ieyasu Tokugawa": {
    file: "ieyasu-tokugawa.webp",
    credit: "Kanō Tan'yū",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tokugawa_Ieyasu2.JPG",
  },
  "Immanuel Kant": {
    file: "immanuel-kant.webp",
    credit: "Johann Gottlieb Becker (1720-1782)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Immanuel_Kant_-_Gemaelde_1.jpg",
  },
  "Isaac Newton": {
    file: "isaac-newton.webp",
    credit: "Godfrey Kneller",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Portrait_of_Sir_Isaac_Newton,_1689_(brightened).jpg",
  },
  "Johann Wolfgang von Goethe": {
    file: "johann-wolfgang-von-goethe.webp",
    credit: "Joseph Karl Stieler",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Goethe_(Stieler_1828).jpg",
  },
  "John F. Kennedy": {
    file: "john-f-kennedy.webp",
    credit: "Cecil W. Stoughton",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:John_F._Kennedy,_White_House_color_photo_portrait.jpg",
  },
  "Julius Caesar": {
    file: "julius-caesar.webp",
    credit: "Ángel M. Felicísimo from Mérida, España",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Retrato_de_Julio_C%C3%A9sar_(26724093101)_(cropped).jpg",
  },
  "Katsushika Hokusai": {
    file: "katsushika-hokusai.webp",
    credit: "missing name",
    license: "CC0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hokusai_as_an_old_man.jpg",
  },
  "Konosuke Matsushita": {
    file: "konosuke-matsushita.webp",
    credit: "Unknown authorUnknown author",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Formal_Portrait_of_K%C5%8Dnosuke_Matsushita_in_1929.jpg",
  },
  "Lao Tzu": {
    file: "lao-tzu.webp",
    credit: "Zhang Lu",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Zhang_Lu-Laozi_Riding_an_Ox_(cropped).jpg",
  },
  "Leo Tolstoy": {
    file: "leo-tolstoy.webp",
    credit: "Sergei Prokudin-Gorskii",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Leo_Tolstoy_1908_Portrait_(3x4_cropped).jpg",
  },
  "Leonardo da Vinci": {
    file: "leonardo-da-vinci.webp",
    credit: "Leonardo da Vinci",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Leonardo_self.jpg",
  },
  "Louis Pasteur": {
    file: "louis-pasteur.webp",
    credit: "Paul Nadar",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Louis_Pasteur,_foto_av_Paul_Nadar,_Crisco_edit.jpg",
  },
  "Ludwig van Beethoven": {
    file: "ludwig-van-beethoven.webp",
    credit: "Joseph Karl Stieler",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg",
  },
  "Mahatma Gandhi": {
    file: "mahatma-gandhi.webp",
    credit: "Elliott &amp; Fry",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mahatma-Gandhi,_studio,_1931.jpg",
  },
  "Marcus Aurelius": {
    file: "marcus-aurelius.webp",
    credit: "Daniel Martin",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:MSR-ra-61-b-1-DM.jpg",
  },
  "Marie Curie": {
    file: "marie-curie.webp",
    credit: "Henri Manuel",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Marie_Curie_c._1920s.jpg",
  },
  "Mark Twain": {
    file: "mark-twain.webp",
    credit: "A.F. Bradley, New York",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mark_Twain_by_AF_Bradley_(cropped_2).jpg",
  },
  "Martin Luther King Jr.": {
    file: "martin-luther-king-jr.webp",
    credit: "Bernie Faingold",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Martin_Luther_King,_Jr..jpg",
  },
  "Matsuo Basho": {
    file: "matsuo-basho.webp",
    credit: "Morikawa Kyoriku (1656-1715)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Basho_by_Morikawa_Kyoriku_(1656-1715).jpg",
  },
  "Michelangelo": {
    file: "michelangelo.webp",
    credit: "Attributed to Daniele da Volterra",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Michelangelo_Daniele_da_Volterra_(dettaglio).jpg",
  },
  "Mother Teresa": {
    file: "mother-teresa.webp",
    credit: "Kingkongphoto &amp; www.celebrity-photos.com from Laurel Maryland, USA",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Mother_Teresa_1.jpg",
  },
  "Murasaki Shikibu": {
    file: "murasaki-shikibu.webp",
    credit: "Tosa Mitsuoki",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tosa_Mitsuoki%E2%80%94Portrait_of_Murasaki_Shikibu.jpg",
  },
  "Nelson Mandela": {
    file: "nelson-mandela.webp",
    credit: "Kingkongphoto &amp; www.celebrity-photos.com from Laurel",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Nelson_Mandela_1994.jpg",
  },
  "Nikola Tesla": {
    file: "nikola-tesla.webp",
    credit: "Napoleon Sarony",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tesla_circa_1890.jpeg",
  },
  "Nobunaga Oda": {
    file: "nobunaga-oda.webp",
    credit: "狩野宗秀 (Kanō Sōshū, 1551 - 1601)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Odanobunaga.jpg",
  },
  "Orville Wright": {
    file: "orville-wright.webp",
    credit: "Orville Wright and Wilbur Wright (credited as photographers) [1], [2]",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Orville_Wright_1905-crop.jpg",
  },
  "Oscar Wilde": {
    file: "oscar-wilde.webp",
    credit: "Napoleon Sarony / Adam Cuerden",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Oscar_Wilde_by_Napoleon_Sarony._Three-quarter-length_photograph,_seated_(cropped).jpg",
  },
  "Pablo Picasso": {
    file: "pablo-picasso.webp",
    credit: "Argentina. Revista Vea y Lea",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Pablo_picasso_1.jpg",
  },
  "Peter Drucker": {
    file: "peter-drucker.webp",
    credit: "Jeff McNeill",
    license: "CC BY-SA 2.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Drucker5789.jpg",
  },
  "Plato": {
    file: "plato.webp",
    credit: "Marie-Lan Nguyen",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Plato_Silanion_Musei_Capitolini_MC1377.png",
  },
  "Ralph Waldo Emerson": {
    file: "ralph-waldo-emerson.webp",
    credit: "Josiah Johnson Hawes",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Ralph_Waldo_Emerson_by_Josiah_Johnson_Hawes_1857.jpg",
  },
  "Rene Descartes": {
    file: "rene-descartes.webp",
    credit: "After Frans Hals",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg",
  },
  "Ryoma Sakamoto": {
    file: "ryoma-sakamoto.webp",
    credit: "Unknown authorUnknown author",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sakamoto_Ryoma.jpg",
  },
  "Sen no Rikyu": {
    file: "sen-no-rikyu.webp",
    credit: "painted by 長谷川等伯, calligraphy by 春屋宗園",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sen_no_Rikyu_JPN_(cropped).jpg",
  },
  "Seneca": {
    file: "seneca.webp",
    credit: "Calidius",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Duble_herma_of_Socrates_and_Seneca_Antikensammlung_Berlin_07.jpg",
  },
  "Shoin Yoshida": {
    file: "shoin-yoshida.webp",
    credit: "Unknown authorUnknown author",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Yoshida_Shoin.jpg",
  },
  "Socrates": {
    file: "socrates.webp",
    credit: "Copy of Lysippos (?)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Socrates_Louvre.jpg",
  },
  "Stephen Hawking": {
    file: "stephen-hawking.webp",
    credit: "NASA",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Stephen_Hawking.StarChild.jpg",
  },
  "Steve Jobs": {
    file: "steve-jobs.webp",
    credit: "Matthew Yohe",
    license: "CC BY-SA 3.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Steve_Jobs_Headshot_2010_(cropped_4).jpg",
  },
  "Takamori Saigo": {
    file: "takamori-saigo.webp",
    credit: "C. Nakagawa (from signature)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Saigo_Takamori_(b).jpg",
  },
  "Takuboku Ishikawa": {
    file: "takuboku-ishikawa.webp",
    credit: "Unknown authorUnknown author",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Takuboku_Ishikawa.jpg",
  },
  "Thomas Edison": {
    file: "thomas-edison.webp",
    credit: "Louis Bachrach, Bachrach Studios, restored by Michel Vuijlsteke",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Thomas_Edison2.jpg",
  },
  "Umeko Tsuda": {
    file: "umeko-tsuda.webp",
    credit: "Unknown authorUnknown author",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Tsuda_Umeko_Portrait_c1900.png",
  },
  "Victor Hugo": {
    file: "victor-hugo.webp",
    credit: "Étienne Carjat",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Victor_Hugo_by_%C3%89tienne_Carjat_1876_-_full.jpg",
  },
  "Vincent van Gogh": {
    file: "vincent-van-gogh.webp",
    credit: "Vincent van Gogh",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project_(454045).jpg",
  },
  "William Shakespeare": {
    file: "william-shakespeare.webp",
    credit: "Attributed to John Taylor",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:William_Shakespeare_by_John_Taylor,_edited.jpg",
  },
  "Winston Churchill": {
    file: "winston-churchill.webp",
    credit: "Yousuf Karsh",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Sir_Winston_Churchill_-_19086236948_(restored).jpg",
  },
  "Wolfgang Amadeus Mozart": {
    file: "wolfgang-amadeus-mozart.webp",
    credit: "Barbara Krafft",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Barbara_Krafft_-_Portr%C3%A4t_Wolfgang_Amadeus_Mozart_(1819).jpg",
  },
  "Yozan Uesugi": {
    file: "yozan-uesugi.webp",
    credit: "不明。",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:%E4%B8%8A%E6%9D%89%E9%B7%B9%E5%B1%B1.jpg",
  },
  "Yukichi Fukuzawa": {
    file: "yukichi-fukuzawa.webp",
    credit: "Fukuzawa Research Center",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Fukuzawa_Yukichi_1891_(cropped).jpg",
  },
};

/** クレジット表示が要るライセンスか(パブリックドメインとCC0は不要) */
export function needsCredit(license: string): boolean {
  const free = ["public domain", "cc0", "pd-"];
  const l = license.toLowerCase();
  return !free.some((f) => l.startsWith(f));
}
