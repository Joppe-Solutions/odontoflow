import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	ErrCode,
	isAPIError,
	type subscription,
} from "@/lib/api/encore-client";
import { getApiClient } from "@/lib/api/server-side";
import { plans } from "@/lib/plans";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CheckCircle2, CreditCard, Wallet, XCircle, Sparkles } from "lucide-react";

interface SubscriptionPageProps {
	searchParams: Promise<{
		success?: string;
		session_id?: string;
		canceled?: string;
	}>;
}

export default async function SubscriptionPage(
	props: Readonly<SubscriptionPageProps>,
) {
	const { success, canceled } = await props.searchParams;

	const { userId } = await auth();
	if (!userId) {
		redirect("/sign-in");
	}

	const apiClient = await getApiClient();

	let currentSubscription: subscription.GetSubscriptionsResponse | undefined;
	try {
		currentSubscription = await apiClient.subscription.getSubscription();
	} catch (error) {
		if (!(isAPIError(error) && error.code === ErrCode.NotFound)) {
			throw error;
		}
	}

	const createCheckoutSession = async (formData: FormData) => {
		"use server";
		const stripePriceId = formData.get("stripePriceId") as string;

		const serverApiClient = await getApiClient();
		const session = await serverApiClient.subscription.createCheckoutSession({
			priceId: stripePriceId,
		});
		redirect(session.url);
	};

	const createPortalSession = async () => {
		"use server";
		const serverApiClient = await getApiClient();
		const session = await serverApiClient.subscription.createPortalSession();
		redirect(session.url);
	};

	const currentPlan = plans.find(
		(plan) => plan.stripePriceId === currentSubscription?.priceId,
	);

	return (
		<div className="space-y-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-display font-bold">Assinatura</h1>
				<p className="text-muted-foreground mt-1">
					Gerencie seu plano de assinatura e informações de cobrança.
				</p>
			</div>

			{success === "true" && (
				<Card className="border-success/50 bg-success/5">
					<CardContent className="flex items-center gap-3 py-4">
						<CheckCircle2 className="h-5 w-5 text-success shrink-0" />
						<div>
							<p className="font-medium text-success">Assinatura ativada com sucesso!</p>
							<p className="text-sm text-muted-foreground">
								Você agora tem acesso a todos os recursos do seu plano.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{canceled === "true" && (
				<Card className="border-warning/50 bg-warning/5">
					<CardContent className="flex items-center gap-3 py-4">
						<XCircle className="h-5 w-5 text-warning shrink-0" />
						<div>
							<p className="font-medium text-warning">Checkout cancelado</p>
							<p className="text-sm text-muted-foreground">
								O processo de pagamento foi cancelado. Você pode tentar novamente quando quiser.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{currentPlan ? (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<Wallet className="h-5 w-5 text-primary" />
							</div>
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<CardTitle className="text-lg font-display">Plano Atual</CardTitle>
									<Badge variant="default">Ativo</Badge>
								</div>
								<CardDescription>
									Sua assinatura está ativa e funcionando normalmente.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
							<div>
								<p className="font-display font-bold text-xl">{currentPlan.name}</p>
								<p className="text-sm text-muted-foreground">Plano mensal</p>
							</div>
							<div className="text-right">
								<p className="font-display font-bold text-2xl">
									R$ {currentPlan.price}
									<span className="text-sm font-normal text-muted-foreground">/mês</span>
								</p>
							</div>
						</div>

						<form action={createPortalSession}>
							<Button type="submit" variant="outline" className="w-full">
								<CreditCard className="h-4 w-4 mr-2" />
								Gerenciar Assinatura
							</Button>
						</form>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<Sparkles className="h-5 w-5 text-primary" />
							</div>
							<div>
								<CardTitle className="text-lg font-display">Escolha seu Plano</CardTitle>
								<CardDescription>
									Selecione o plano que melhor atende às necessidades da sua clínica.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<form action={createCheckoutSession} className="space-y-6">
							<RadioGroup defaultValue={plans[0].stripePriceId} name="stripePriceId" className="space-y-3">
								{plans.map((plan) => (
									<div
										key={plan.name}
										className="flex items-center space-x-3 p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
									>
										<RadioGroupItem value={plan.stripePriceId} id={plan.stripePriceId} />
										<Label htmlFor={plan.stripePriceId} className="flex-1 cursor-pointer">
											<div className="flex items-center justify-between">
												<div>
													<p className="font-medium">{plan.name}</p>
													<p className="text-sm text-muted-foreground">
														Acesso a todos os recursos do plano
													</p>
												</div>
												<p className="font-display font-bold">
													R$ {plan.price}
													<span className="text-sm font-normal text-muted-foreground">/mês</span>
												</p>
											</div>
										</Label>
									</div>
								))}
							</RadioGroup>

							<Button type="submit" className="w-full">
								<CreditCard className="h-4 w-4 mr-2" />
								Assinar Agora
							</Button>
						</form>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-lg font-display">Recursos Inclusos</CardTitle>
					<CardDescription>
						Todos os planos incluem acesso aos seguintes recursos:
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 sm:grid-cols-2">
						{[
							"Gestão ilimitada de pacientes",
							"Anamnese digital personalizada",
							"Upload e análise de exames",
							"Diagnóstico assistido por IA",
							"Prescrições com assinatura digital",
							"Suporte por e-mail",
							"Backup automático de dados",
							"Conformidade com LGPD",
						].map((feature) => (
							<div key={feature} className="flex items-center gap-2">
								<CheckCircle2 className="h-4 w-4 text-success shrink-0" />
								<span className="text-sm">{feature}</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
