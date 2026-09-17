/* ==========================================================================
   BOBA & CHILL - MENU DATASET
   ========================================================================== */

export const CATEGORIES = [
  { id: 'all', name: 'Tất Cả Món', icon: 'fa-solid fa-list' },
  { id: 'milk-tea', name: 'Trà Sữa', icon: 'fa-solid fa-glass-water' },
  { id: 'coffee', name: 'Cà Phê Việt & Ý', icon: 'fa-solid fa-mug-hot' },
  { id: 'fruit-tea', name: 'Trà Trái Cây', icon: 'fa-solid fa-lemon' },
  { id: 'smoothie', name: 'Sinh Tố & Nước Ép', icon: 'fa-solid fa-blender' },
  { id: 'ice-blended', name: 'Đá Xay Frosty', icon: 'fa-solid fa-snowflake' }
];

export const MENU_ITEMS = [
  {
    id: 'drink-1',
    categoryId: 'milk-tea',
    name: 'Trà Sữa Trân Châu Hoàng Gia',
    description: 'Trà đen Ceylon đậm đà kết hợp với sữa béo nhập khẩu và trân châu đen nấu mật ong dẻo thơm.',
    basePrice: 45000,
    rating: 4.9,
    tag: 'BÁN CHẠY 🔥',
    image: 'assets/images/hero_bubble_tea.jpg'
  },
  {
    id: 'drink-2',
    categoryId: 'coffee',
    name: 'Cà Phê Muối Xứ Huế',
    description: 'Cà phê phin truyền thống đậm đà, lớp kem muối biển đánh bông béo mặn thanh lịch.',
    basePrice: 39000,
    rating: 4.8,
    tag: 'SPECIAL 🌟',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-3',
    categoryId: 'fruit-tea',
    name: 'Trà Mãng Cầu Đắc Lắc Tươi',
    description: 'Thịt mãng cầu xiêm tươi mọng nước kết hợp trà lài thanh mát, ngọt chua cân bằng cực đã.',
    basePrice: 48000,
    rating: 4.9,
    tag: 'HOT HÈ 🌴',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-4',
    categoryId: 'smoothie',
    name: 'Sinh Tố Bơ Dừa Béo Nậy',
    description: 'Bơ sáp Đắk Lắk xay cùng mứt dừa nướng và sữa đặc thơm lừng bổ dưỡng.',
    basePrice: 52000,
    rating: 4.7,
    tag: 'ORGANIC 🥑',
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-5',
    categoryId: 'milk-tea',
    name: 'Matcha Latte Kem Cheese Hoàng Kim',
    description: 'Bột Matcha Uji Nhật Bản hảo hạng hòa quyện với lớp macchiato phô mai béo ngậy.',
    basePrice: 55000,
    rating: 4.9,
    tag: 'PREMIUM 👑',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-6',
    categoryId: 'fruit-tea',
    name: 'Trà Dâu Tây Cam Sả Tươi',
    description: 'Dâu tây Đà Lạt ngâm đường phèn kết hợp nước cốt cam vàng và hương sả nồng nàn.',
    basePrice: 46000,
    rating: 4.8,
    tag: 'BEST BUY 🍓',
    image: 'assets/images/fresh_fruit_tea.jpg'
  },
  {
    id: 'drink-7',
    categoryId: 'coffee',
    name: 'Cà Phê Phin Sữa Đá Sài Gòn',
    description: 'Hạt Robusta Buôn Ma Thuột rang đậm phin truyền thống, dồi dào năng lượng sảng khoái.',
    basePrice: 32000,
    rating: 4.9,
    tag: 'TRADITIONAL 🇻🇳',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'drink-8',
    categoryId: 'ice-blended',
    name: 'Chanh Dây Tuyết Đá Xay Frosty',
    description: 'Nước cốt chanh dây tươi xay đá mát lạnh cùng sốt vani ngậy nhẹ giải nhiệt đỉnh cao.',
    basePrice: 49000,
    rating: 4.7,
    tag: 'REFRESH ❄️',
    image: 'https://images.unsplash.com/photo-1497534446932-c925b458314e?w=600&auto=format&fit=crop&q=80'
  }
];

export const SIZES = [
  { id: 'S', name: 'Size S (Vừa)', price: 0 },
  { id: 'M', name: 'Size M (+5.000đ)', price: 5000 },
  { id: 'L', name: 'Size L (+10.000đ)', price: 10000 }
];

export const ICE_LEVELS = [
  { id: '100', name: '100% Đá (Thường)' },
  { id: '50', name: '50% Đá (Ít đá)' },
  { id: '0', name: 'Không Đá' }
];

export const SWEET_LEVELS = [
  { id: '100', name: '100% Đường (Chuẩn)' },
  { id: '70', name: '70% Đường' },
  { id: '50', name: '50% Đường (Ít ngọt)' },
  { id: '30', name: '30% Đường' },
  { id: '0', name: 'Không Đường' }
];

export const TOPPINGS = [
  { id: 'top-1', name: 'Trân Châu Đen Hoàng Gia', price: 8000 },
  { id: 'top-2', name: 'Pudding Trứng Mềm Mịn', price: 10000 },
  { id: 'top-3', name: 'Kem Cheese Macchiato', price: 12000 },
  { id: 'top-4', name: 'Sương Sáo Giòn Ngọt', price: 7000 },
  { id: 'top-5', name: 'Thạch Dừa Giòn Mỏng', price: 8000 },
  { id: 'top-6', name: 'Trân Châu Hoàng Kim', price: 10000 }
];

export const VOUCHERS = {
  'XINCHAO10': { type: 'percent', value: 10, minSubtotal: 0, description: 'Giảm 10% tổng đơn' },
  'CHILL20': { type: 'percent', value: 20, minSubtotal: 100000, description: 'Giảm 20% cho đơn từ 100k' },
  'FREESHIP': { type: 'fixed', value: 15000, minSubtotal: 80000, description: 'Miễn phí giao hàng (Giảm 15.000đ)' }
};
