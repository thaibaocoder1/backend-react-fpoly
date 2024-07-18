import { Coupon } from "../app/model/Coupon";

const checkCoupon = async (coupon: any) => {
  const foundCoupon = await Coupon.findById({ _id: coupon._id });
  const now: number = Math.floor(Date.now());
  const couponExpire: number = Math.floor(foundCoupon?.expireIns as number);
  if (!foundCoupon) throw new Error(`Coupon delete: ${coupon.name}`);
  if (now > couponExpire) throw new Error(`Coupon expired: ${coupon.name}`);
  return foundCoupon;
};

export const checkCoupons = async (coupons: any[]) => {
  if (coupons.length === 0) return;

  const errors: string[] = [];

  try {
    const promises = coupons.map(checkCoupon);
    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        errors.push(result.reason.message);
      }
    });
    if (errors.length > 0) {
      throw new Error(`Invalid coupons, : ${errors.join(", ")}`);
    }
  } catch (error) {
    return error.message;
  }
};
