/*
 * RigCheck VN — Dữ liệu nhúng (seed / fallback)
 * Giá VND: đối chiếu niêm yết online tại các shop linh kiện VN (GearVN, Phong Vũ, Hacom...),
 * thời điểm đối chiếu: 10/2026. Đây là giá tham khảo, không phải giá bán trực tiếp.
 * PRICE_SOURCE / UPDATED_AT dùng chung cho toàn bộ dữ liệu đóng gói bên dưới.
 * File này chạy được cả trên trình duyệt (biến toàn cục RIGCHECK_DATA)
 * và trong Node (module.exports) để script tools/generate-seed.mjs sinh supabase/seed.sql.
 */
'use strict';

const PRICE_SOURCE = 'Đối chiếu niêm yết online shop linh kiện VN (10/2026)';
const UPDATED_AT = '2026-10-23T00:00:00+07:00';

const RIGCHECK_DATA = {
  priceSource: PRICE_SOURCE,
  updatedAt: UPDATED_AT,

  /* ================= CPU — 16 mẫu | socket: LGA1700 / LGA1851 / AM5 =================
   * score: điểm hiệu năng chơi game tương đối (100 ≈ Ryzen 5 7500F) */
  cpus: [
    { id: 'i3-12100f',   name: 'Intel Core i3-12100F',        brand: 'Intel', socket: 'LGA1700', cores: 4,  threads: 8,  tdp: 58,  price: 2390000,  score: 72 },
    { id: 'i5-12400f',   name: 'Intel Core i5-12400F',        brand: 'Intel', socket: 'LGA1700', cores: 6,  threads: 12, tdp: 65,  price: 3290000,  score: 84 },
    { id: 'i5-13400f',   name: 'Intel Core i5-13400F',        brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, tdp: 65,  price: 4490000,  score: 90 },
    { id: 'i5-14600kf',  name: 'Intel Core i5-14600KF',       brand: 'Intel', socket: 'LGA1700', cores: 14, threads: 20, tdp: 125, price: 6990000,  score: 102 },
    { id: 'i7-14700k',   name: 'Intel Core i7-14700K',        brand: 'Intel', socket: 'LGA1700', cores: 20, threads: 28, tdp: 125, price: 9890000,  score: 108 },
    { id: 'i9-14900k',   name: 'Intel Core i9-14900K',        brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, tdp: 125, price: 13990000, score: 112 },
    { id: 'cu5-245k',    name: 'Intel Core Ultra 5 245K',     brand: 'Intel', socket: 'LGA1851', cores: 14, threads: 14, tdp: 125, price: 7490000,  score: 104 },
    { id: 'cu7-265k',    name: 'Intel Core Ultra 7 265K',     brand: 'Intel', socket: 'LGA1851', cores: 20, threads: 20, tdp: 125, price: 10490000, score: 110 },
    { id: 'cu9-285k',    name: 'Intel Core Ultra 9 285K',     brand: 'Intel', socket: 'LGA1851', cores: 24, threads: 24, tdp: 125, price: 15490000, score: 114 },
    { id: 'r5-7500f',    name: 'AMD Ryzen 5 7500F',           brand: 'AMD',   socket: 'AM5',     cores: 6,  threads: 12, tdp: 65,  price: 3890000,  score: 100 },
    { id: 'r5-7600x',    name: 'AMD Ryzen 5 7600X',           brand: 'AMD',   socket: 'AM5',     cores: 6,  threads: 12, tdp: 105, price: 5290000,  score: 103 },
    { id: 'r7-7800x3d',  name: 'AMD Ryzen 7 7800X3D',         brand: 'AMD',   socket: 'AM5',     cores: 8,  threads: 16, tdp: 120, price: 9490000,  score: 122 },
    { id: 'r5-9600x',    name: 'AMD Ryzen 5 9600X',           brand: 'AMD',   socket: 'AM5',     cores: 6,  threads: 12, tdp: 65,  price: 6190000,  score: 108 },
    { id: 'r7-9700x',    name: 'AMD Ryzen 7 9700X',           brand: 'AMD',   socket: 'AM5',     cores: 8,  threads: 16, tdp: 65,  price: 7990000,  score: 112 },
    { id: 'r7-9800x3d',  name: 'AMD Ryzen 7 9800X3D',         brand: 'AMD',   socket: 'AM5',     cores: 8,  threads: 16, tdp: 120, price: 11990000, score: 130 },
    { id: 'r9-9900x',    name: 'AMD Ryzen 9 9900X',           brand: 'AMD',   socket: 'AM5',     cores: 12, threads: 24, tdp: 120, price: 11490000, score: 118 },
  ],

  /* ================= GPU — 21 mẫu | perf: hiệu năng tương đối (100 ≈ RTX 4060 Ti) ================= */
  gpus: [
    { id: 'rtx3050',     name: 'NVIDIA RTX 3050 6GB',         brand: 'NVIDIA', vram: 6,  tdp: 70,  length: 200, price: 4690000,  perf: 45 },
    { id: 'rtx4060',     name: 'NVIDIA RTX 4060 8GB',         brand: 'NVIDIA', vram: 8,  tdp: 115, length: 240, price: 7490000,  perf: 82 },
    { id: 'rtx4060ti',   name: 'NVIDIA RTX 4060 Ti 8GB',      brand: 'NVIDIA', vram: 8,  tdp: 160, length: 245, price: 9490000,  perf: 100 },
    { id: 'rtx4070',     name: 'NVIDIA RTX 4070 12GB',        brand: 'NVIDIA', vram: 12, tdp: 200, length: 245, price: 14490000, perf: 120 },
    { id: 'rtx4070s',    name: 'NVIDIA RTX 4070 Super 12GB',  brand: 'NVIDIA', vram: 12, tdp: 220, length: 267, price: 15990000, perf: 132 },
    { id: 'rtx4070tis',  name: 'NVIDIA RTX 4070 Ti Super 16GB', brand: 'NVIDIA', vram: 16, tdp: 285, length: 305, price: 20990000, perf: 150 },
    { id: 'rtx4080s',    name: 'NVIDIA RTX 4080 Super 16GB',  brand: 'NVIDIA', vram: 16, tdp: 320, length: 310, price: 26990000, perf: 175 },
    { id: 'rtx4090',     name: 'NVIDIA RTX 4090 24GB',        brand: 'NVIDIA', vram: 24, tdp: 450, length: 336, price: 52990000, perf: 210 },
    { id: 'rtx5050',     name: 'NVIDIA RTX 5050 8GB',         brand: 'NVIDIA', vram: 8,  tdp: 130, length: 230, price: 6490000,  perf: 55 },
    { id: 'rtx5060',     name: 'NVIDIA RTX 5060 8GB',         brand: 'NVIDIA', vram: 8,  tdp: 145, length: 242, price: 8290000,  perf: 90 },
    { id: 'rtx5060ti',   name: 'NVIDIA RTX 5060 Ti 16GB',     brand: 'NVIDIA', vram: 16, tdp: 180, length: 247, price: 11490000, perf: 105 },
    { id: 'rtx5070',     name: 'NVIDIA RTX 5070 12GB',        brand: 'NVIDIA', vram: 12, tdp: 250, length: 250, price: 15490000, perf: 135 },
    { id: 'rtx5070ti',   name: 'NVIDIA RTX 5070 Ti 16GB',     brand: 'NVIDIA', vram: 16, tdp: 300, length: 306, price: 21990000, perf: 160 },
    { id: 'rtx5080',     name: 'NVIDIA RTX 5080 16GB',        brand: 'NVIDIA', vram: 16, tdp: 360, length: 310, price: 29990000, perf: 185 },
    { id: 'rtx5090',     name: 'NVIDIA RTX 5090 32GB',        brand: 'NVIDIA', vram: 32, tdp: 575, length: 304, price: 64990000, perf: 235 },
    { id: 'rx7600',      name: 'AMD RX 7600 8GB',             brand: 'AMD',    vram: 8,  tdp: 165, length: 240, price: 6490000,  perf: 75 },
    { id: 'rx7700xt',    name: 'AMD RX 7700 XT 12GB',         brand: 'AMD',    vram: 12, tdp: 245, length: 267, price: 10490000, perf: 105 },
    { id: 'rx7800xt',    name: 'AMD RX 7800 XT 16GB',         brand: 'AMD',    vram: 16, tdp: 263, length: 287, price: 12490000, perf: 125 },
    { id: 'rx9060xt',    name: 'AMD RX 9060 XT 16GB',         brand: 'AMD',    vram: 16, tdp: 182, length: 240, price: 9490000,  perf: 100 },
    { id: 'rx9070',      name: 'AMD RX 9070 16GB',            brand: 'AMD',    vram: 16, tdp: 220, length: 267, price: 14990000, perf: 140 },
    { id: 'rx9070xt',    name: 'AMD RX 9070 XT 16GB',         brand: 'AMD',    vram: 16, tdp: 304, length: 290, price: 16990000, perf: 155 },
  ],

  /* ================= Mainboard — 12 mẫu | form: ITX < mATX < ATX ================= */
  mainboards: [
    { id: 'h610m',       name: 'MSI PRO H610M-E DDR4',          brand: 'MSI',    socket: 'LGA1700', chipset: 'H610',  ramType: 'DDR4', form: 'mATX', price: 1690000 },
    { id: 'b760m-d4',    name: 'Gigabyte B760M DS3H DDR4',      brand: 'Gigabyte', socket: 'LGA1700', chipset: 'B760', ramType: 'DDR4', form: 'mATX', price: 2790000 },
    { id: 'b760m-d5',    name: 'ASUS PRIME B760M-A DDR5',       brand: 'ASUS',   socket: 'LGA1700', chipset: 'B760',  ramType: 'DDR5', form: 'mATX', price: 3290000 },
    { id: 'b760-toma',   name: 'MSI MAG B760 Tomahawk DDR5',    brand: 'MSI',    socket: 'LGA1700', chipset: 'B760',  ramType: 'DDR5', form: 'ATX',  price: 4490000 },
    { id: 'z790e',       name: 'ASUS ROG Strix Z790-E DDR5',    brand: 'ASUS',   socket: 'LGA1700', chipset: 'Z790',  ramType: 'DDR5', form: 'ATX',  price: 8990000 },
    { id: 'b650m',       name: 'Gigabyte B650M D3HP DDR5',      brand: 'Gigabyte', socket: 'AM5',   chipset: 'B650',  ramType: 'DDR5', form: 'mATX', price: 2990000 },
    { id: 'b650-toma',   name: 'MSI B650 Tomahawk WiFi DDR5',   brand: 'MSI',    socket: 'AM5',     chipset: 'B650',  ramType: 'DDR5', form: 'ATX',  price: 4990000 },
    { id: 'b650e',       name: 'ASUS ROG Strix B650E-F DDR5',   brand: 'ASUS',   socket: 'AM5',     chipset: 'B650E', ramType: 'DDR5', form: 'ATX',  price: 6490000 },
    { id: 'b850m',       name: 'Gigabyte B850M Aorus Elite DDR5', brand: 'Gigabyte', socket: 'AM5', chipset: 'B850',  ramType: 'DDR5', form: 'mATX', price: 4390000 },
    { id: 'x870e',       name: 'MSI MPG X870E Carbon WiFi DDR5', brand: 'MSI',   socket: 'AM5',     chipset: 'X870E', ramType: 'DDR5', form: 'ATX',  price: 10990000 },
    { id: 'b860m',       name: 'Gigabyte B860M DS3H DDR5',      brand: 'Gigabyte', socket: 'LGA1851', chipset: 'B860', ramType: 'DDR5', form: 'mATX', price: 3990000 },
    { id: 'z890-hero',   name: 'ASUS ROG Maximus Z890 Hero DDR5', brand: 'ASUS', socket: 'LGA1851', chipset: 'Z890',  ramType: 'DDR5', form: 'ATX',  price: 14990000 },
  ],

  /* ================= RAM — 10 mẫu | sticks: số thanh trong kit ================= */
  rams: [
    { id: 'ram-d4-16-3200', name: 'Kingston Fury Beast DDR4 16GB (2x8) 3200MHz',  brand: 'Kingston', type: 'DDR4', capacity: 16, sticks: 2, speed: 3200, price: 890000 },
    { id: 'ram-d4-32-3200', name: 'Corsair Vengeance LPX DDR4 32GB (2x16) 3200MHz', brand: 'Corsair', type: 'DDR4', capacity: 32, sticks: 2, speed: 3200, price: 1590000 },
    { id: 'ram-d4-32-3600', name: 'G.Skill Trident Z DDR4 32GB (2x16) 3600MHz',   brand: 'G.Skill',  type: 'DDR4', capacity: 32, sticks: 2, speed: 3600, price: 1790000 },
    { id: 'ram-d5-16-5600', name: 'Kingston Fury Beast DDR5 16GB (1x16) 5600MHz', brand: 'Kingston', type: 'DDR5', capacity: 16, sticks: 1, speed: 5600, price: 1190000 },
    { id: 'ram-d5-32-5600', name: 'Corsair Vengeance DDR5 32GB (2x16) 5600MHz',   brand: 'Corsair',  type: 'DDR5', capacity: 32, sticks: 2, speed: 5600, price: 2190000 },
    { id: 'ram-d5-32-6000', name: 'G.Skill Trident Z5 RGB DDR5 32GB (2x16) 6000MHz', brand: 'G.Skill', type: 'DDR5', capacity: 32, sticks: 2, speed: 6000, price: 2490000 },
    { id: 'ram-d5-32-6400', name: 'Kingston Fury Renegade DDR5 32GB (2x16) 6400MHz', brand: 'Kingston', type: 'DDR5', capacity: 32, sticks: 2, speed: 6400, price: 2790000 },
    { id: 'ram-d5-64-6000', name: 'G.Skill Trident Z5 DDR5 64GB (2x32) 6000MHz',  brand: 'G.Skill',  type: 'DDR5', capacity: 64, sticks: 2, speed: 6000, price: 4690000 },
    { id: 'ram-d5-64-6400', name: 'Corsair Dominator Platinum DDR5 64GB (2x32) 6400MHz', brand: 'Corsair', type: 'DDR5', capacity: 64, sticks: 2, speed: 6400, price: 5990000 },
    { id: 'ram-d5-48-7200', name: 'TeamGroup T-Force Delta DDR5 48GB (2x24) 7200MHz', brand: 'TeamGroup', type: 'DDR5', capacity: 48, sticks: 2, speed: 7200, price: 4290000 },
  ],

  /* ================= SSD — 10 mẫu ================= */
  ssds: [
    { id: 'ssd-p3-500',    name: 'Crucial P3 500GB NVMe Gen3',        brand: 'Crucial',  capacity: 500,  gen: 3, price: 890000 },
    { id: 'ssd-970evo-1t', name: 'Samsung 970 Evo Plus 1TB Gen3',     brand: 'Samsung',  capacity: 1000, gen: 3, price: 1790000 },
    { id: 'ssd-nv2-1t',    name: 'Kingston NV2 1TB Gen4',             brand: 'Kingston', capacity: 1000, gen: 4, price: 1390000 },
    { id: 'ssd-sn770-1t',  name: 'WD Black SN770 1TB Gen4',           brand: 'WD',       capacity: 1000, gen: 4, price: 1690000 },
    { id: 'ssd-990pro-1t', name: 'Samsung 990 Pro 1TB Gen4',          brand: 'Samsung',  capacity: 1000, gen: 4, price: 2190000 },
    { id: 'ssd-990pro-2t', name: 'Samsung 990 Pro 2TB Gen4',          brand: 'Samsung',  capacity: 2000, gen: 4, price: 3990000 },
    { id: 'ssd-sn850x-2t', name: 'WD Black SN850X 2TB Gen4',          brand: 'WD',       capacity: 2000, gen: 4, price: 4190000 },
    { id: 'ssd-f530-1t',   name: 'Seagate FireCuda 530 1TB Gen4',     brand: 'Seagate',  capacity: 1000, gen: 4, price: 1890000 },
    { id: 'ssd-t700-1t',   name: 'Crucial T700 1TB Gen5',             brand: 'Crucial',  capacity: 1000, gen: 5, price: 3290000 },
    { id: 'ssd-9100pro-2t', name: 'Samsung 9100 Pro 2TB Gen5',        brand: 'Samsung',  capacity: 2000, gen: 5, price: 6490000 },
  ],

  /* ================= PSU — 8 mẫu ================= */
  psus: [
    { id: 'psu-550',  name: 'Cooler Master MWE 550W Bronze',   brand: 'Cooler Master', watt: 550,  rating: '80+ Bronze', price: 890000 },
    { id: 'psu-650',  name: 'MSI MAG A650BN 650W Bronze',      brand: 'MSI',           watt: 650,  rating: '80+ Bronze', price: 1090000 },
    { id: 'psu-750',  name: 'Corsair RM750e 750W Gold',        brand: 'Corsair',       watt: 750,  rating: '80+ Gold',   price: 1890000 },
    { id: 'psu-850',  name: 'Corsair RM850e 850W Gold',        brand: 'Corsair',       watt: 850,  rating: '80+ Gold',   price: 2290000 },
    { id: 'psu-850s', name: 'Seasonic Focus GX-850 850W Gold', brand: 'Seasonic',      watt: 850,  rating: '80+ Gold',   price: 2490000 },
    { id: 'psu-1000', name: 'ASUS ROG Strix 1000W Platinum',   brand: 'ASUS',          watt: 1000, rating: '80+ Platinum', price: 3990000 },
    { id: 'psu-1000c', name: 'Corsair RM1000x 1000W Gold',     brand: 'Corsair',       watt: 1000, rating: '80+ Gold',   price: 3290000 },
    { id: 'psu-1200', name: 'Seasonic Prime TX-1200 1200W Titanium', brand: 'Seasonic', watt: 1200, rating: '80+ Titanium', price: 6490000 },
  ],

  /* ================= Case — 9 mẫu | maxForm: form main lớn nhất hỗ trợ ================= */
  cases: [
    { id: 'case-air100', name: 'Montech AIR 100',              brand: 'Montech',  maxForm: 'mATX', gpuMax: 330, coolerMax: 160, radiatorMax: 240, price: 990000,  color: 'Trắng' },
    { id: 'case-ap201',  name: 'ASUS Prime AP201',             brand: 'ASUS',     maxForm: 'mATX', gpuMax: 338, coolerMax: 170, radiatorMax: 360, price: 1590000, color: 'Đen' },
    { id: 'case-nr200p', name: 'Cooler Master NR200P',         brand: 'Cooler Master', maxForm: 'ITX', gpuMax: 330, coolerMax: 155, radiatorMax: 280, price: 1890000, color: 'Đen' },
    { id: 'case-h5flow', name: 'NZXT H5 Flow',                 brand: 'NZXT',     maxForm: 'ATX',  gpuMax: 365, coolerMax: 165, radiatorMax: 360, price: 1990000, color: 'Trắng' },
    { id: 'case-4000d',  name: 'Corsair 4000D Airflow',        brand: 'Corsair',  maxForm: 'ATX',  gpuMax: 360, coolerMax: 170, radiatorMax: 280, price: 1890000, color: 'Đen' },
    { id: 'case-north',  name: 'Fractal Design North',         brand: 'Fractal',  maxForm: 'ATX',  gpuMax: 355, coolerMax: 170, radiatorMax: 240, price: 3290000, color: 'Đen/Gỗ' },
    { id: 'case-lancool', name: 'Lian Li Lancool 216',         brand: 'Lian Li',  maxForm: 'ATX',  gpuMax: 392, coolerMax: 180, radiatorMax: 360, price: 2190000, color: 'Đen' },
    { id: 'case-o11',    name: 'Lian Li O11 Vision',           brand: 'Lian Li',  maxForm: 'ATX',  gpuMax: 455, coolerMax: 167, radiatorMax: 360, price: 3490000, color: 'Trắng' },
    { id: 'case-h9',     name: 'NZXT H9 Elite',                brand: 'NZXT',     maxForm: 'ATX',  gpuMax: 435, coolerMax: 165, radiatorMax: 360, price: 3990000, color: 'Trắng' },
  ],

  /* ================= Tản nhiệt — 9 mẫu | type: air (height mm) / aio (radiator mm) ================= */
  coolers: [
    { id: 'cool-ax120',  name: 'Thermalright Assassin X 120 Refined SE', brand: 'Thermalright', type: 'air', height: 148, radiator: 0,   tdpSupport: 220, price: 490000 },
    { id: 'cool-se214',  name: 'ID-COOLING SE-214-XT ARGB',              brand: 'ID-COOLING',   type: 'air', height: 150, radiator: 0,   tdpSupport: 220, price: 450000 },
    { id: 'cool-ak400',  name: 'DeepCool AK400',                          brand: 'DeepCool',     type: 'air', height: 155, radiator: 0,   tdpSupport: 220, price: 690000 },
    { id: 'cool-pa120',  name: 'Thermalright Peerless Assassin 120 SE',   brand: 'Thermalright', type: 'air', height: 157, radiator: 0,   tdpSupport: 245, price: 890000 },
    { id: 'cool-nhd15',  name: 'Noctua NH-D15 G2',                        brand: 'Noctua',       type: 'air', height: 168, radiator: 0,   tdpSupport: 250, price: 2890000 },
    { id: 'cool-ls520',  name: 'DeepCool LS520 AIO 240',                  brand: 'DeepCool',     type: 'aio', height: 55,  radiator: 240, tdpSupport: 280, price: 1790000 },
    { id: 'cool-ml240',  name: 'MSI MAG CoreLiquid 360R V2 AIO 360',      brand: 'MSI',          type: 'aio', height: 55,  radiator: 360, tdpSupport: 300, price: 2290000 },
    { id: 'cool-kraken', name: 'NZXT Kraken 280 RGB AIO 280',             brand: 'NZXT',         type: 'aio', height: 55,  radiator: 280, tdpSupport: 280, price: 3490000 },
    { id: 'cool-titan',  name: 'Corsair iCUE Link Titan 360 RX AIO 360',  brand: 'Corsair',      type: 'aio', height: 55,  radiator: 360, tdpSupport: 320, price: 4490000 },
  ],

  /* ================= Laptop — 16 mẫu gaming phổ biến tại VN =================
   * gpuPerf đã hiệu chỉnh theo TGP thực tế của từng mẫu (tham chiếu Notebookcheck).
   * cpuScore cùng thang với CPU desktop ở trên. */
  laptops: [
    { id: 'lap-nitro5-4050',  name: 'Acer Nitro 5 AN515',            brand: 'Acer',   cpu: 'Intel i5-12500H',        cpuScore: 78,  gpu: 'RTX 4050 Laptop', gpuPerf: 62,  tgp: 95,  ram: 16, price: 18990000 },
    { id: 'lap-victus-4050',  name: 'HP Victus 16',                  brand: 'HP',     cpu: 'Intel i5-13500H',        cpuScore: 82,  gpu: 'RTX 4050 Laptop', gpuPerf: 60,  tgp: 95,  ram: 16, price: 19990000 },
    { id: 'lap-loq-4060',     name: 'Lenovo LOQ 15IAX9',             brand: 'Lenovo', cpu: 'Intel i5-12450HX',       cpuScore: 80,  gpu: 'RTX 4060 Laptop', gpuPerf: 78,  tgp: 115, ram: 16, price: 21990000 },
    { id: 'lap-tuf-4060',     name: 'ASUS TUF Gaming F15',           brand: 'ASUS',   cpu: 'Intel i7-13620H',        cpuScore: 88,  gpu: 'RTX 4060 Laptop', gpuPerf: 80,  tgp: 115, ram: 16, price: 24990000 },
    { id: 'lap-katana-4060',  name: 'MSI Katana 15',                 brand: 'MSI',    cpu: 'Intel i7-13620H',        cpuScore: 88,  gpu: 'RTX 4060 Laptop', gpuPerf: 76,  tgp: 105, ram: 16, price: 23990000 },
    { id: 'lap-legion5-4060', name: 'Lenovo Legion 5 15IRX9',        brand: 'Lenovo', cpu: 'Intel i7-14650HX',       cpuScore: 98,  gpu: 'RTX 4060 Laptop', gpuPerf: 85,  tgp: 140, ram: 16, price: 28990000 },
    { id: 'lap-nitrov-5060',  name: 'Acer Nitro V 16 ANV16',         brand: 'Acer',   cpu: 'Intel i7-14650HX',       cpuScore: 98,  gpu: 'RTX 5060 Laptop', gpuPerf: 88,  tgp: 115, ram: 16, price: 27990000 },
    { id: 'lap-legion5-5060', name: 'Lenovo Legion 5 (2025) RTX 5060', brand: 'Lenovo', cpu: 'AMD Ryzen 7 260',      cpuScore: 100, gpu: 'RTX 5060 Laptop', gpuPerf: 92,  tgp: 115, ram: 16, price: 31990000 },
    { id: 'lap-omen-4070',    name: 'HP OMEN 16',                    brand: 'HP',     cpu: 'Intel i7-14700HX',       cpuScore: 102, gpu: 'RTX 4070 Laptop', gpuPerf: 102, tgp: 140, ram: 16, price: 34990000 },
    { id: 'lap-aorus-4070',   name: 'Gigabyte AORUS 16X',            brand: 'Gigabyte', cpu: 'Intel i7-14650HX',     cpuScore: 98,  gpu: 'RTX 4070 Laptop', gpuPerf: 100, tgp: 130, ram: 16, price: 33990000 },
    { id: 'lap-strix-4070',   name: 'ASUS ROG Strix G16',            brand: 'ASUS',   cpu: 'Intel i9-14900HX',       cpuScore: 108, gpu: 'RTX 4070 Laptop', gpuPerf: 105, tgp: 140, ram: 32, price: 42990000 },
    { id: 'lap-zephyrus-5070', name: 'ASUS ROG Zephyrus G14 (2025)', brand: 'ASUS',   cpu: 'AMD Ryzen AI 9 HX 370',  cpuScore: 106, gpu: 'RTX 5070 Laptop', gpuPerf: 110, tgp: 110, ram: 32, price: 54990000 },
    { id: 'lap-legionpro5',   name: 'Lenovo Legion Pro 5',           brand: 'Lenovo', cpu: 'Intel i9-14900HX',       cpuScore: 108, gpu: 'RTX 4070 Laptop', gpuPerf: 106, tgp: 140, ram: 32, price: 44990000 },
    { id: 'lap-legionpro7',   name: 'Lenovo Legion Pro 7i',          brand: 'Lenovo', cpu: 'Intel i9-14900HX',       cpuScore: 110, gpu: 'RTX 4080 Laptop', gpuPerf: 140, tgp: 175, ram: 32, price: 69990000 },
    { id: 'lap-helios-4090',  name: 'Acer Predator Helios 18',       brand: 'Acer',   cpu: 'Intel i9-14900HX',       cpuScore: 110, gpu: 'RTX 4090 Laptop', gpuPerf: 165, tgp: 175, ram: 32, price: 89990000 },
    { id: 'lap-raider-5080',  name: 'MSI Raider 18 HX AI',           brand: 'MSI',    cpu: 'Intel Core Ultra 9 285HX', cpuScore: 112, gpu: 'RTX 5080 Laptop', gpuPerf: 150, tgp: 175, ram: 64, price: 99990000 },
  ],

  /* ================= Game — 27 game =================
   * baseFps: FPS trung bình tham chiếu ở 1080p High với GPU perf=100 + CPU score=100.
   * cpuWeight: 0 = nặng GPU, 1 = nặng CPU (esports thường cao). */
  games: [
    { id: 'valorant',    name: 'Valorant',                    baseFps: 420, cpuWeight: 0.75, genre: 'Esports / FPS' },
    { id: 'cs2',         name: 'Counter-Strike 2',            baseFps: 300, cpuWeight: 0.65, genre: 'Esports / FPS' },
    { id: 'lol',         name: 'League of Legends',           baseFps: 380, cpuWeight: 0.70, genre: 'Esports / MOBA' },
    { id: 'dota2',       name: 'Dota 2',                      baseFps: 240, cpuWeight: 0.60, genre: 'Esports / MOBA' },
    { id: 'pubg',        name: 'PUBG: Battlegrounds',         baseFps: 130, cpuWeight: 0.50, genre: 'Battle Royale' },
    { id: 'apex',        name: 'Apex Legends',                baseFps: 165, cpuWeight: 0.45, genre: 'Battle Royale' },
    { id: 'fortnite',    name: 'Fortnite',                    baseFps: 150, cpuWeight: 0.45, genre: 'Battle Royale' },
    { id: 'ow2',         name: 'Overwatch 2',                 baseFps: 260, cpuWeight: 0.50, genre: 'Esports / FPS' },
    { id: 'warzone',     name: 'Call of Duty: Warzone',       baseFps: 120, cpuWeight: 0.45, genre: 'Battle Royale' },
    { id: 'genshin',     name: 'Genshin Impact',              baseFps: 140, cpuWeight: 0.35, genre: 'Action RPG' },
    { id: 'wuwa',        name: 'Wuthering Waves',             baseFps: 95,  cpuWeight: 0.40, genre: 'Action RPG' },
    { id: 'zzz',         name: 'Zenless Zone Zero',           baseFps: 130, cpuWeight: 0.40, genre: 'Action RPG' },
    { id: 'gtav',        name: 'GTA V',                       baseFps: 150, cpuWeight: 0.45, genre: 'Open World' },
    { id: 'minecraft',   name: 'Minecraft',                   baseFps: 300, cpuWeight: 0.65, genre: 'Sandbox' },
    { id: 'fc25',        name: 'EA Sports FC 25',             baseFps: 165, cpuWeight: 0.40, genre: 'Thể thao' },
    { id: 'cyberpunk',   name: 'Cyberpunk 2077',              baseFps: 62,  cpuWeight: 0.30, genre: 'AAA / RPG' },
    { id: 'eldenring',   name: 'Elden Ring',                  baseFps: 75,  cpuWeight: 0.35, genre: 'AAA / RPG' },
    { id: 'wukong',      name: 'Black Myth: Wukong',          baseFps: 48,  cpuWeight: 0.25, genre: 'AAA / RPG' },
    { id: 'bg3',         name: "Baldur's Gate 3",             baseFps: 85,  cpuWeight: 0.45, genre: 'AAA / RPG' },
    { id: 'witcher3',    name: 'The Witcher 3',               baseFps: 88,  cpuWeight: 0.35, genre: 'AAA / RPG' },
    { id: 'hogwarts',    name: 'Hogwarts Legacy',             baseFps: 70,  cpuWeight: 0.35, genre: 'AAA / RPG' },
    { id: 'gowr',        name: 'God of War Ragnarök',         baseFps: 82,  cpuWeight: 0.35, genre: 'AAA / Hành động' },
    { id: 'helldivers2', name: 'Helldivers 2',                baseFps: 78,  cpuWeight: 0.40, genre: 'AAA / Co-op' },
    { id: 'forza5',      name: 'Forza Horizon 5',             baseFps: 110, cpuWeight: 0.30, genre: 'Đua xe' },
    { id: 'doom',        name: 'DOOM Eternal',                baseFps: 210, cpuWeight: 0.30, genre: 'AAA / FPS' },
    { id: 'spiderman',   name: 'Marvel\'s Spider-Man Remastered', baseFps: 90, cpuWeight: 0.40, genre: 'AAA / Hành động' },
    { id: 'starfield',   name: 'Starfield',                   baseFps: 55,  cpuWeight: 0.45, genre: 'AAA / RPG' },
  ],

  /* ================= Phần mềm sáng tạo — 8 mục (khung sẵn, chưa chấm điểm) ================= */
  software: [
    { id: 'premiere',  name: 'Adobe Premiere Pro',   category: 'Dựng video', focus: 'CPU đa nhân, GPU tăng tốc encode, RAM 32GB+' },
    { id: 'davinci',   name: 'DaVinci Resolve',      category: 'Dựng video', focus: 'VRAM GPU là yếu tố quyết định ở hiệu ứng Fusion' },
    { id: 'photoshop', name: 'Adobe Photoshop',       category: 'Đồ hoạ / vẽ', focus: 'CPU đơn nhân, RAM lớn cho file PSD nhiều lớp' },
    { id: 'illustrator', name: 'Adobe Illustrator',  category: 'Đồ hoạ / vẽ', focus: 'CPU đơn nhân, ưu tiên xung nhịp cao' },
    { id: 'afterfx',   name: 'Adobe After Effects',  category: 'Dựng video', focus: 'RAM 64GB+, CPU đa nhân cho render preview' },
    { id: 'blender',   name: 'Blender',              category: '3D / Render', focus: 'GPU CUDA/OptiX khi render Cycles, VRAM cho scene lớn' },
    { id: 'autocad',   name: 'AutoCAD',              category: 'Kỹ thuật / CAD', focus: 'CPU đơn nhân, GPU tầm trung là đủ' },
    { id: 'obs',       name: 'OBS Studio',           category: 'Livestream', focus: 'GPU có NVENC để stream không giật game' },
  ],

  /* ================= Local AI — 4 mục (khung sẵn, chưa chấm điểm) ================= */
  aiTools: [
    { id: 'ollama',    name: 'Ollama',               category: 'LLM tại nhà', focus: 'VRAM quyết định cỡ model: 8GB ≈ 7B, 16GB ≈ 14B, 24GB+ ≈ 32B (Q4)' },
    { id: 'lmstudio',  name: 'LM Studio',            category: 'LLM tại nhà', focus: 'Chạy model GGUF, cần RAM hệ thống + VRAM cân đối' },
    { id: 'comfyui',   name: 'ComfyUI',              category: 'AI tạo ảnh', focus: 'VRAM cho Stable Diffusion / Flux, GPU NVIDIA lợi thế CUDA' },
    { id: 'sdwebui',   name: 'Stable Diffusion WebUI (A1111)', category: 'AI tạo ảnh', focus: 'VRAM 8GB chạy SD1.5/SDXL cơ bản, 16GB+ thoải mái hơn' },
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RIGCHECK_DATA;
}
if (typeof window !== 'undefined') {
  window.RIGCHECK_DATA = RIGCHECK_DATA;
}
