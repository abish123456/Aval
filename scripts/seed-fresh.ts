/**
 * Seed DB — creates admin + categories + products with real images.
 * Run: npx tsx scripts/seed-fresh.ts
 */
import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding fresh data...\n')

  // ── 1. Admin User ─────────────────────────────────────────────────────────
  // Credentials come from the environment — never hard-coded.
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) before seeding.')
  }
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.user.create({
    data: {
      name: 'Aval Admin',
      email: adminEmail,
      passwordHash,
      role: 'OWNER',
      phone: '9999999999',
    },
  })
  console.log(`✓ Admin created — email: ${adminEmail}`)
  console.log(`  id: ${admin.id}`)

  // ── 2. Categories ─────────────────────────────────────────────────────────
  const [catBridal, catHair, catCustom] = await Promise.all([
    prisma.category.create({
      data: {
        id: 'cat-bridal',
        name: 'Bridal Bangles',
        slug: 'bridal-bangles',
        image: '/images/antique_bangles.jpg',
        description: 'Handcrafted bridal bangles for your special day. Each piece tells a story of South Indian heritage and love.',
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-hair',
        name: 'Hair Accessories',
        slug: 'hair-accessories',
        image: '/images/pearl_hair_clip.jpg',
        description: 'Elegant handmade hair accessories crafted with pearls, kundan and traditional art.',
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        id: 'cat-custom',
        name: 'Customised Sets',
        slug: 'customised-sets',
        image: '/images/kundan_set.jpg',
        description: 'Personalised jewellery sets made to order — your name, your story, your jewellery.',
        sortOrder: 3,
      },
    }),
  ])
  console.log('✓ 3 categories created: Bridal Bangles, Hair Accessories, Customised Sets')

  // ── 3. Products ───────────────────────────────────────────────────────────
  const products = [
    {
      id: 'prod-kundan-bridal',
      name: 'Kundan Royal Bridal Bangle Set',
      slug: 'kundan-royal-bridal-bangle-set',
      categoryId: catBridal.id,
      regularPricePaise: 289900,   // ₹2,899
      salePricePaise:   189900,    // ₹1,899
      stock: 8,
      customisable: true,
      isBestSeller: true,
      isNew: false,
      rating: 4.8,
      reviewCount: 24,
      description: 'A stunning Kundan Royal Bridal Bangle Set handcrafted by our artisans in Kanyakumari. Each bangle is set with premium kundan stones and finished with 22KT gold polish. Perfect for your wedding day.',
      details: [
        'Premium Kundan setting with 22KT gold polish',
        'Set of 6 bangles — sizes available from 2.4 to 2.8',
        'Hypoallergenic base metal',
        'Ships in branded gift box',
        'Customisation available — contact us',
      ],
      images: [
        '/images/kundan_set.jpg',
        '/images/antique_bangles.jpg',
        '/images/hero_bangles.jpg',
      ],
      sizes: ['2.4', '2.6', '2.8'],
    },
    {
      id: 'prod-antique-gold',
      name: 'Antique Gold Temple Bangles',
      slug: 'antique-gold-temple-bangles',
      categoryId: catBridal.id,
      regularPricePaise: 159900,   // ₹1,599
      salePricePaise:   119900,    // ₹1,199
      stock: 15,
      customisable: false,
      isBestSeller: true,
      isNew: false,
      rating: 4.6,
      reviewCount: 18,
      description: 'Timeless antique gold temple bangles inspired by South Indian temple jewellery. Each piece features intricate hand-engraved motifs of goddess figures and floral patterns.',
      details: [
        'Antique gold finish with oxidised detailing',
        'Set of 4 bangles',
        'Sizes 2.4, 2.6, 2.8 available',
        'Inspired by Kanyakumari temple jewellery tradition',
        'Comes with branded velvet pouch',
      ],
      images: [
        '/images/antique_bangles.jpg',
        '/images/hero_bangles.jpg',
      ],
      sizes: ['2.4', '2.6', '2.8'],
    },
    {
      id: 'prod-pearl-hair',
      name: 'Pearl Cluster Hair Pin Set',
      slug: 'pearl-cluster-hair-pin-set',
      categoryId: catHair.id,
      regularPricePaise: 89900,    // ₹899
      salePricePaise:   69900,     // ₹699
      stock: 20,
      customisable: false,
      isBestSeller: false,
      isNew: true,
      rating: 4.5,
      reviewCount: 9,
      description: 'Delicate pearl cluster hair pins that add a touch of elegance to any bridal look. Freshwater pearls set in antique gold tone finish.',
      details: [
        'Set of 6 hair pins',
        'Freshwater pearl clusters',
        'Antique gold tone metal',
        'Suitable for all hair types',
        'Perfect for bridesmaids too',
      ],
      images: [
        '/images/pearl_hair_clip.jpg',
        '/images/trousseau_box.jpg',
      ],
      sizes: ['One Size'],
    },
    {
      id: 'prod-name-bangle',
      name: 'Customised Name Bangle',
      slug: 'customised-name-bangle',
      categoryId: catCustom.id,
      regularPricePaise: 129900,   // ₹1,299
      salePricePaise:   99900,     // ₹999
      stock: 10,
      customisable: true,
      isBestSeller: false,
      isNew: true,
      rating: 4.9,
      reviewCount: 31,
      description: 'Your name, forever in gold. Our artisans hand-craft each name bangle with your chosen name in Tamil or English script. The perfect personal gift for a bride-to-be.',
      details: [
        'Hand-engraved name in Tamil or English',
        'Available in gold or silver finish',
        '7–10 working days lead time',
        'Gift wrapped with personal message card',
        'Upto 8 characters per bangle',
      ],
      images: [
        '/images/name_bangles.jpg',
        '/images/trousseau_box.jpg',
      ],
      sizes: ['2.4', '2.6', '2.8'],
    },
    {
      id: 'prod-trousseau',
      name: 'Bridal Trousseau Box — Full Set',
      slug: 'bridal-trousseau-box-full-set',
      categoryId: catCustom.id,
      regularPricePaise: 599900,   // ₹5,999
      salePricePaise:   449900,    // ₹4,499
      stock: 5,
      customisable: true,
      isBestSeller: true,
      isNew: false,
      rating: 4.7,
      reviewCount: 12,
      description: 'The complete bridal package — everything the bride needs in one curated trousseau box. Includes bangle set, hair accessories, and customised name jewellery, all in a branded keepsake box.',
      details: [
        'Includes: Bangle Set (6 pieces) + Hair Pin Set + Name Bangle',
        'Premium branded keepsake box',
        'Personal message card included',
        'Free express shipping',
        'Customise every piece to your preference',
      ],
      images: [
        '/images/trousseau_box.jpg',
        '/images/kundan_set.jpg',
        '/images/pearl_hair_clip.jpg',
        '/images/name_bangles.jpg',
      ],
      sizes: ['Gift Set'],
    },
  ]

  for (const p of products) {
    await prisma.product.create({ data: p })
    console.log(`  ✓ Product: ${p.name}  (₹${p.salePricePaise / 100})`)
  }

  console.log(`\n✅ Seeding complete!`)
  console.log(`\n📋 Summary:`)
  console.log(`   Admin login  → http://localhost:3000/admin`)
  console.log(`   Email        → ${adminEmail} (password from ADMIN_PASSWORD)`)
  console.log(`   Products     → ${products.length} products seeded`)
  console.log(`   Categories   → 3 categories`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

