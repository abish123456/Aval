import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAndSeed() {
  console.log('🔄 Cleaning up database tables...')

  // 1. Delete order & enquiry transactions (cascading order)
  await prisma.enquiryMessage.deleteMany({})
  await prisma.enquiryRating.deleteMany({})
  await prisma.enquiry.deleteMany({})

  await prisma.orderStatusEvent.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.refund.deleteMany({})
  await prisma.orderDiscount.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.order.deleteMany({})

  await prisma.customOrder.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.wishlist.deleteMany({})
  await prisma.inventoryMovement.deleteMany({})

  await prisma.couponRedemption.deleteMany({})
  await prisma.coupon.deleteMany({})
  await prisma.promotion.deleteMany({})

  await prisma.address.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.passwordResetToken.deleteMany({})
  await prisma.auditLog.deleteMany({})
  await prisma.emailOutbox.deleteMany({})

  // Clean products & categories
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})

  // Clean users
  await prisma.user.deleteMany({})

  console.log('✨ All old data cleared successfully.')

  // 2. Settings
  console.log('⚙️ Seeding store settings...')
  const defaultSettings = [
    { key: 'storeName', value: 'AVAL Store — Handcrafted Bridal Studio' },
    { key: 'location', value: 'Kanyakumari, Tamil Nadu' },
    { key: 'currency', value: 'INR' },
    { key: 'freeShippingThresholdPaise', value: '50000' }, // ₹500
    { key: 'flatShippingPaise', value: '8000' },           // ₹80
    { key: 'taxMode', value: 'NONE' },
    { key: 'taxRateBp', value: '0' },
    { key: 'stackItemOffers', value: 'false' },
    { key: 'supportPhone', value: '+91 94883 45678' },
    { key: 'supportEmail', value: 'diana@aval.com' },
  ]
  for (const s of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  // 3. Admin User: diana@aval.com / aval2026
  console.log('👤 Creating Admin user (diana@aval.com)...')
  const passwordHash = await bcrypt.hash('aval2026', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'Diana / Studio Owner',
      email: 'diana@aval.com',
      passwordHash,
      role: 'OWNER',
      phone: '+91 94883 45678',
    },
  })
  console.log(`✅ Admin created: ${admin.email} (Role: OWNER)`)

  // 4. Categories
  console.log('📁 Seeding categories...')
  const categories = [
    {
      id: 'cat-1',
      name: 'Bridal Bangles',
      slug: 'bridal-bangles',
      image: '/images/hero_bangles.jpg',
      description: 'Custom silk thread, Kundan, and pearl sets tailored to your wedding lehenga & saree.',
      sortOrder: 1,
    },
    {
      id: 'cat-2',
      name: 'Hair Clips & Pins',
      slug: 'hair-clips',
      image: '/images/pearl_hair_clip.jpg',
      description: 'Jadabi floral hair extensions, poola jada clips, and bridal barrettes.',
      sortOrder: 2,
    },
    {
      id: 'cat-3',
      name: 'Customised Name Sets',
      slug: 'customised',
      image: '/images/name_bangles.jpg',
      description: 'Embossed bride & groom names, wedding dates, and bridal hashtags.',
      sortOrder: 3,
    },
    {
      id: 'cat-4',
      name: 'Bridesmaid Favours',
      slug: 'bridesmaid',
      image: '/images/kundan_set.jpg',
      description: 'Coordinated bangle sets, potli bags, and gift boxes for your bride tribe.',
      sortOrder: 4,
    },
    {
      id: 'cat-5',
      name: 'Gift Boxes & Combos',
      slug: 'gift-sets',
      image: '/images/trousseau_box.jpg',
      description: 'Curated bridal trousseau sets complete with presentation velvet boxes.',
      sortOrder: 5,
    },
  ]
  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }

  // 5. Products
  console.log('💍 Seeding initial products...')
  const products = [
    {
      id: 'prod-1',
      name: 'Kundan Royal Bridal Bangle Set',
      slug: 'kundan-bridal-bangle-set',
      categoryId: 'cat-1',
      regularPricePaise: 249900,
      salePricePaise: 189900,
      stock: 20,
      customisable: true,
      isBestSeller: true,
      rating: 4.9,
      reviewCount: 128,
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
      categoryId: 'cat-2',
      regularPricePaise: 89900,
      salePricePaise: 69900,
      stock: 30,
      customisable: false,
      isBestSeller: true,
      rating: 4.8,
      reviewCount: 84,
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
      categoryId: 'cat-1',
      regularPricePaise: 159900,
      salePricePaise: 129900,
      stock: 15,
      customisable: false,
      isNew: true,
      rating: 4.9,
      reviewCount: 47,
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
      categoryId: 'cat-3',
      regularPricePaise: 179900,
      salePricePaise: 139900,
      stock: 50,
      customisable: true,
      isBestSeller: true,
      rating: 5.0,
      reviewCount: 162,
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
      categoryId: 'cat-2',
      regularPricePaise: 69900,
      salePricePaise: 54900,
      stock: 25,
      customisable: false,
      rating: 4.7,
      reviewCount: 39,
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
      categoryId: 'cat-1',
      regularPricePaise: 189900,
      salePricePaise: 149900,
      stock: 12,
      customisable: false,
      rating: 4.9,
      reviewCount: 73,
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
  for (const prod of products) {
    await prisma.product.create({ data: prod })
  }

  // 6. Coupons
  console.log('🏷️ Seeding coupons...')
  const coupons = [
    {
      code: 'WED10',
      description: 'Wedding Season Special — 10% off',
      discountType: 'PERCENT',
      valueBp: 1000,
      minSpendPaise: 100000,
      usageLimit: 200,
      active: true,
    },
    {
      code: 'AVALBRIDE',
      description: 'Bridal Welcome Gift — 15% off',
      discountType: 'PERCENT',
      valueBp: 1500,
      minSpendPaise: 150000,
      usageLimit: 100,
      active: true,
    },
  ]
  for (const c of coupons) {
    await prisma.coupon.create({ data: c })
  }

  console.log('🎉 Reset and seeding complete!')
  console.log('--------------------------------------------------')
  console.log('Admin Login Credentials:')
  console.log('URL:      /admin/login')
  console.log('Email:    diana@aval.com')
  console.log('Password: aval2026')
  console.log('Role:     OWNER')
  console.log('--------------------------------------------------')
}

resetAndSeed()
  .catch((e) => {
    console.error('Error during reset and seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
