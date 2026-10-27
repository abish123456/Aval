export interface Product {
  id: string
  name: string
  slug: string
  category: string
  categorySlug: string
  regularPrice: number
  salePrice: number
  discountPercent: number
  rating: number
  reviewCount: number
  isBestSeller?: boolean
  isNew?: boolean
  customisable: boolean
  stock: number
  description: string
  details: string[]
  images: string[]
  sizes: string[]
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  itemCount: number
  description: string
}

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    name: 'Bridal Bangles',
    slug: 'bridal-bangles',
    image: '/images/hero_bangles.jpg',
    itemCount: 28,
    description: 'Custom silk thread, Kundan, and pearl sets tailored to your wedding lehenga & saree.',
  },
  {
    id: 'cat-2',
    name: 'Hair Clips & Pins',
    slug: 'hair-clips',
    image: '/images/pearl_hair_clip.jpg',
    itemCount: 19,
    description: 'Jadabi floral hair extensions, poola jada clips, and bridal barrettes.',
  },
  {
    id: 'cat-3',
    name: 'Customised Name Sets',
    slug: 'customised',
    image: '/images/name_bangles.jpg',
    itemCount: 14,
    description: 'Embossed bride & groom names, wedding dates, and bridal hashtags.',
  },
  {
    id: 'cat-4',
    name: 'Bridesmaid Favours',
    slug: 'bridesmaid',
    image: '/images/kundan_set.jpg',
    itemCount: 22,
    description: 'Coordinated bangle sets, potli bags, and gift boxes for your bride tribe.',
  },
  {
    id: 'cat-5',
    name: 'Gift Boxes & Combos',
    slug: 'gift-sets',
    image: '/images/trousseau_box.jpg',
    itemCount: 16,
    description: 'Curated bridal trousseau sets complete with presentation velvet boxes.',
  },
]

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Kundan Royal Bridal Bangle Set',
    slug: 'kundan-bridal-bangle-set',
    category: 'Bridal Bangles',
    categorySlug: 'bridal-bangles',
    regularPrice: 2499,
    salePrice: 1899,
    discountPercent: 24,
    rating: 4.9,
    reviewCount: 128,
    isBestSeller: true,
    customisable: true,
    stock: 15,
    description: 'Exquisite multi-row bridal set handcrafted in Kanyakumari with fine Kundan stones, rich crimson silk thread, and gold micro-plating. Designed to withstand wedding festivities with superior durability.',
    details: [
      'Handcrafted silk thread base with brass core',
      'Hand-set Kundan stones and dangling mini pearls',
      'Sizes: 2.4, 2.6, 2.8, 2.10',
      'Customisation: Add bride & groom initials on central kada',
      'Packaged in signature AVAL velvet gift trunk',
    ],
    images: [
      '/images/hero_bangles.jpg',
      '/images/kundan_set.jpg',
      '/images/name_bangles.jpg',
    ],
    sizes: ['2.4', '2.6', '2.8', '2.10'],
  },
  {
    id: 'prod-2',
    name: 'Freshwater Pearl Bridal Hair Clip',
    slug: 'pearl-hair-clip',
    category: 'Hair Clips & Pins',
    categorySlug: 'hair-clips',
    regularPrice: 899,
    salePrice: 699,
    discountPercent: 22,
    rating: 4.8,
    reviewCount: 84,
    isBestSeller: true,
    customisable: false,
    stock: 28,
    description: 'Delicate hand-wired freshwater pearls intertwined with crystal marquis leaves on an alligator clip. Lightweight and comfortable for high-drama bridal hairstyles.',
    details: [
      'Genuine baroque freshwater pearls & Japanese seed beads',
      'Non-slip grip teeth suitable for thick South Indian hair',
      'Flexible wire branches to contour to updos or braids',
      'Tarnish-resistant rose gold/antique gold plating',
    ],
    images: [
      '/images/pearl_hair_clip.jpg',
      '/images/hero_bangles.jpg',
    ],
    sizes: ['Standard (12cm)'],
  },
  {
    id: 'prod-3',
    name: 'Bridal Temple Maang Tikka & Matha Patti',
    slug: 'bridal-maang-tikka',
    category: 'Bridal Bangles',
    categorySlug: 'bridal-bangles',
    regularPrice: 1599,
    salePrice: 1299,
    discountPercent: 19,
    rating: 4.9,
    reviewCount: 47,
    isNew: true,
    customisable: false,
    stock: 12,
    description: 'Heritage temple jewellery style forehead ornament with Goddess Lakshmi engraving, ruby red cabochon stones, and hanging pearl jhumkis.',
    details: [
      'Antique gold finish with ruby red stones',
      'Central pendant: 4.5cm width',
      'Adjustable hooks for secure hair pin placement',
    ],
    images: [
      '/images/antique_bangles.jpg',
      '/images/hero_bangles.jpg',
    ],
    sizes: ['One Size'],
  },
  {
    id: 'prod-4',
    name: 'Personalised Bride Name & Date Bangles',
    slug: 'name-bangle-custom',
    category: 'Customised Name Sets',
    categorySlug: 'customised',
    regularPrice: 1799,
    salePrice: 1399,
    discountPercent: 22,
    rating: 5.0,
    reviewCount: 162,
    isBestSeller: true,
    customisable: true,
    stock: 50,
    description: 'Our most loved wedding keepsake! Pair of wide acrylic-brass kadas custom lettered with bride & groom names, wedding hashtag, and auspicious wedding date.',
    details: [
      'Calligraphy text printed & sealed under waterproof protective gloss',
      'Choice of velvet border or golden zardosi trim',
      'Delivery timeline: 5-7 working days across India',
    ],
    images: [
      '/images/name_bangles.jpg',
      '/images/trousseau_box.jpg',
    ],
    sizes: ['2.2', '2.4', '2.6', '2.8', '2.10'],
  },
  {
    id: 'prod-5',
    name: 'Rose Gold Floral Bridal Hair Vine',
    slug: 'rose-gold-hair-pin',
    category: 'Hair Clips & Pins',
    categorySlug: 'hair-clips',
    regularPrice: 699,
    salePrice: 549,
    discountPercent: 21,
    rating: 4.7,
    reviewCount: 39,
    customisable: false,
    stock: 20,
    description: 'Romantic 30cm flexible hair vine featuring enameled blush petals, Swarovski crystal droplets, and soft champagne gold wire.',
    details: [
      'Length: 30cm, bends easily around braids and chignons',
      'Comes with 4 matching bobby pins and satin ribbons',
    ],
    images: [
      '/images/pearl_hair_clip.jpg',
      '/images/trousseau_box.jpg',
    ],
    sizes: ['30cm Vine'],
  },
  {
    id: 'prod-6',
    name: 'Kanyakumari Temple Antique Bangle Pair',
    slug: 'antique-bangle-set',
    category: 'Bridal Bangles',
    categorySlug: 'bridal-bangles',
    regularPrice: 1899,
    salePrice: 1499,
    discountPercent: 21,
    rating: 4.9,
    reviewCount: 73,
    customisable: false,
    stock: 9,
    description: 'Inspired by traditional South Indian temple motifs, this antique matte-gold kada pair features floral jaali engraving and deep red stones.',
    details: [
      'Screw-opening hinge closure for easy wear',
      'Weight: 45g per piece',
      'Lead and nickel free hypoallergenic alloy',
    ],
    images: [
      '/images/antique_bangles.jpg',
      '/images/hero_bangles.jpg',
    ],
    sizes: ['2.4', '2.6', '2.8'],
  },
]

export interface OrderItem {
  id: string
  product: Product
  size: string
  customName?: string
  weddingDate?: string
  qty: number
  price: number
}

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  customerName: string
  email: string
  phone: string
  shippingAddress: {
    street: string
    city: string
    state: string
    pincode: string
  }
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  paymentMethod: 'Razorpay UPI' | 'Credit/Debit Card' | 'Cash on Delivery'
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED'
  fulfilmentStatus: 'PROCESSING' | 'CONFIRMED' | 'HANDCRAFTING' | 'SHIPPED' | 'DELIVERED'
  trackingNumber?: string
  carrier?: string
  notes?: string
}

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'AVL-9842',
    createdAt: '2026-10-27T10:30:00Z',
    customerName: 'Priya Sundaram',
    email: 'priya.sundaram@gmail.com',
    phone: '+91 98402 12345',
    shippingAddress: {
      street: '14, Beach Road, Near Cape Point',
      city: 'Kanyakumari',
      state: 'Tamil Nadu',
      pincode: '629702',
    },
    items: [
      {
        id: 'item-1',
        product: PRODUCTS[0],
        size: '2.6',
        customName: 'Priya & Karthik',
        weddingDate: '18 Nov 2026',
        qty: 1,
        price: 2099,
      },
      {
        id: 'item-2',
        product: PRODUCTS[1],
        size: 'Standard (12cm)',
        qty: 2,
        price: 699,
      },
    ],
    subtotal: 3497,
    discount: 300,
    shipping: 0,
    total: 3197,
    paymentMethod: 'Razorpay UPI',
    paymentStatus: 'PAID',
    fulfilmentStatus: 'HANDCRAFTING',
    trackingNumber: 'DEL-92841029',
    carrier: 'Delhivery Express',
    notes: 'Bride requested crimson red silk thread with deep gold Kundan stones.',
  },
  {
    id: 'ord-1002',
    orderNumber: 'AVL-9843',
    createdAt: '2026-10-27T14:15:00Z',
    customerName: 'Ananya Ramachandran',
    email: 'ananya.rc@outlook.com',
    phone: '+91 94431 88762',
    shippingAddress: {
      street: 'Flat 402, Lotus Apartments, Race Course Road',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641018',
    },
    items: [
      {
        id: 'item-3',
        product: PRODUCTS[3],
        size: '2.4',
        customName: 'Ananya weds Vikram',
        weddingDate: '02 Dec 2026',
        qty: 1,
        price: 1599,
      },
    ],
    subtotal: 1599,
    discount: 100,
    shipping: 80,
    total: 1579,
    paymentMethod: 'Razorpay UPI',
    paymentStatus: 'PAID',
    fulfilmentStatus: 'PROCESSING',
    notes: 'Urgent order for engagement event.',
  },
]
