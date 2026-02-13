interface Plan {
	name: string;
	price: number;
	features: string[];
	stripeProductId: string;
	stripePriceId: string;
}

function parsePrice(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

const fallbackPlans: Plan[] = [
	{
		name: "Starter",
		price: 97,
		features: ["Up to 50 patients", "Anamnesis module", "Basic dashboard"],
		stripeProductId: "prod_RsP4IJeES8hBDu",
		stripePriceId: "price_1QyeDTGPZxkKVmuncIjFBYj7",
	},
	{
		name: "Professional",
		price: 197,
		features: ["Unlimited patients", "Exams module", "Clinical timeline"],
		stripeProductId: "prod_RsP2eL9TWCTqFR",
		stripePriceId: "price_1QyeEuGPZxkKVmunwbaiAkaO",
	},
	{
		name: "Enterprise",
		price: 497,
		features: ["Multi-user support", "Priority support", "Advanced controls"],
		stripeProductId: "prod_RsP19mrNfkIeXG",
		stripePriceId: "price_1QyeFvGPZxkKVmunS8HJc1OS",
	},
];

const configuredPlans: Plan[] = [
	{
		name: process.env.NEXT_PUBLIC_PLAN_STARTER_NAME || "Starter",
		price: parsePrice(process.env.NEXT_PUBLIC_PLAN_STARTER_PRICE, 97),
		features: ["Up to 50 patients", "Anamnesis module", "Basic dashboard"],
		stripeProductId:
			process.env.NEXT_PUBLIC_PLAN_STARTER_PRODUCT_ID || "prod_placeholder_starter",
		stripePriceId:
			process.env.NEXT_PUBLIC_PLAN_STARTER_PRICE_ID || "",
	},
	{
		name: process.env.NEXT_PUBLIC_PLAN_PRO_NAME || "Professional",
		price: parsePrice(process.env.NEXT_PUBLIC_PLAN_PRO_PRICE, 197),
		features: ["Unlimited patients", "Exams module", "Clinical timeline"],
		stripeProductId:
			process.env.NEXT_PUBLIC_PLAN_PRO_PRODUCT_ID || "prod_placeholder_professional",
		stripePriceId:
			process.env.NEXT_PUBLIC_PLAN_PRO_PRICE_ID || "",
	},
	{
		name: process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_NAME || "Enterprise",
		price: parsePrice(process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE, 497),
		features: ["Multi-user support", "Priority support", "Advanced controls"],
		stripeProductId:
			process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRODUCT_ID || "prod_placeholder_enterprise",
		stripePriceId:
			process.env.NEXT_PUBLIC_PLAN_ENTERPRISE_PRICE_ID || "",
	},
].filter((plan) => plan.stripePriceId);

export const plans = (configuredPlans.length > 0 ? configuredPlans : fallbackPlans) as readonly Plan[];
