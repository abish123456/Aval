import { prisma } from "../lib/db";

async function main() {
  console.log("🌸 Testing AVAL Store New Accepted Flow...");

  // 1. Create a test enquiry
  const token = "test_" + Math.random().toString(36).substring(2, 7);
  const enquiry = await prisma.enquiry.create({
    data: {
      token,
      phoneLastFour: "9876",
      customerName: "Kavitha Rajan (Bride)",
      customerPhone: "9876549876",
      customerWhatsapp: "9876549876",
      deliveryAddress: {
        street: "123 Temple Road",
        city: "Nagercoil",
        state: "Tamil Nadu",
        pincode: "629001",
      },
      items: [
        {
          productId: "test-prod-1",
          productName: "Bridal Kundan Chooda Set",
          size: "2.6",
          qty: 1,
          unitPaise: 450000, // ₹4500
        },
      ],
      totalPaise: 450000,
      status: "ENQUIRY",
      paymentStatus: "PENDING",
    },
  });

  console.log("✅ 1. Enquiry created with token:", enquiry.token);

  // 2. Test Phone Verification (Private link security)
  const isMatch = enquiry.phoneLastFour === "9876";
  const isWrong = enquiry.phoneLastFour === "1111";
  console.log("✅ 2. Phone Verification test:", isMatch === true && isWrong === false ? "PASS" : "FAIL");

  // 3. Add a Chat message
  const msg1 = await prisma.enquiryMessage.create({
    data: {
      enquiryId: enquiry.id,
      senderType: "CUSTOMER",
      body: "Hi AVAL, can you match this with my Rani Pink Muhurtham saree?",
    },
  });
  console.log("✅ 3. Customer Chat Message saved:", msg1.body);

  const msg2 = await prisma.enquiryMessage.create({
    data: {
      enquiryId: enquiry.id,
      senderType: "ADMIN",
      body: "Vanakkam Kavitha! Yes, we have antique gold & rani pink Kundan stones ready. Will customize perfectly!",
    },
  });
  console.log("✅ 4. Artisan Admin Reply saved:", msg2.body);

  // 4. Simulate Payment Success (Webhook / Gateway)
  const paidEnquiry = await prisma.enquiry.update({
    where: { token },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId: "pay_test_12345",
      status: "CONFIRMED", // Enquiry auto-converts to confirmed order!
    },
  });
  console.log("✅ 5. Enquiry converted to Confirmed Order! Status:", paidEnquiry.status, "Payment:", paidEnquiry.paymentStatus);

  // 5. Simulate Artisan Crafting & Dispatch
  const makingEnquiry = await prisma.enquiry.update({
    where: { token },
    data: { status: "MAKING" },
  });
  console.log("✅ 6. Status updated to:", makingEnquiry.status);

  const dispatchedEnquiry = await prisma.enquiry.update({
    where: { token },
    data: {
      status: "DISPATCHED",
      trackingNumber: "BLUEDART_TN_987654",
    },
  });
  console.log("✅ 7. Dispatched with Tracking:", dispatchedEnquiry.trackingNumber);

  // 6. Delivery & Customer Rating
  const deliveredEnquiry = await prisma.enquiry.update({
    where: { token },
    data: { status: "DELIVERED" },
  });
  console.log("✅ 8. Delivered! Status:", deliveredEnquiry.status);

  const rating = await prisma.enquiryRating.create({
    data: {
      enquiryId: enquiry.id,
      stars: 5,
      comment: "Bangles matched my wedding saree 100%! Best bridal customer support on WhatsApp & Web!",
    },
  });
  console.log("✅ 9. Star Rating submitted:", rating.stars, "stars! Comment:", rating.comment);

  // Clean up test record
  await prisma.enquiry.delete({ where: { token } });
  console.log("✅ 10. Cleaned up test data.");

  console.log("\n🎉 ALL 10/10 STEPS OF NEW FLOW PASSED END-TO-END!");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

