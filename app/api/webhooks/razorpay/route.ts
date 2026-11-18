// POST /api/webhooks/razorpay — kept as an alias so a Razorpay dashboard pointing
// at this URL still confirms payments. All handling lives in the enquiry webhook.
export { POST } from '../razorpay-enquiry/route'
