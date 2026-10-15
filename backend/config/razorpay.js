import Razorpay from "razorpay";

/**
 * Razorpay Test Mode client instance.
 * Credentials come from environment variables.
 * If keys are not provided yet (e.g. before user sets up Razorpay dashboard),
 * fallbacks ensure the module initializes without crashing until keys are added.
 */
const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_Tn511iOMoBhBVn";
const key_secret = process.env.RAZORPAY_KEY_SECRET || "EGRvmLzdZT6YBVYVAHuYH7BU";

const razorpay = new Razorpay({
  key_id,
  key_secret,
});

export default razorpay;
