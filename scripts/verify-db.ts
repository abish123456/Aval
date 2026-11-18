import { prisma } from '../lib/db'
async function main() {
  const [p, c, u, e] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count(),
    prisma.enquiry.count(),
  ])
  console.log(`Products: ${p} | Categories: ${c} | Users: ${u} | Enquiries: ${e}`)
  const products = await prisma.product.findMany({ select: { name: true, salePricePaise: true, images: true } })
  products.forEach(p => console.log(`  - ${p.name}  ₹${p.salePricePaise/100}  images: ${JSON.stringify(p.images).slice(0,60)}`))
}
main().catch(console.error).finally(() => { void prisma.$disconnect() })

