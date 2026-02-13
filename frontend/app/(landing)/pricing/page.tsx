import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { plans } from "@/lib/plans";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
	return (
		<div className="py-20">
			<div className="container">
				<div className="text-center max-w-2xl mx-auto mb-16">
					<Badge variant="secondary" className="mb-4">
						<Sparkles className="h-3 w-3 mr-1" />
						Planos flexíveis
					</Badge>
					<h1 className="text-4xl font-display font-bold mb-4">
						Escolha o plano ideal para sua clínica
					</h1>
					<p className="text-muted-foreground text-lg">
						Planos pensados para clínicas de todos os tamanhos.
						Comece gratuitamente e evolua conforme sua necessidade.
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
					{plans.map((plan, index) => (
						<Card
							key={plan.name}
							className={`relative flex flex-col ${
								index === 1
									? "border-primary shadow-lg scale-105"
									: "hover:border-primary/50"
							} transition-all`}
						>
							{index === 1 && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<Badge>Mais popular</Badge>
								</div>
							)}

							<CardHeader className="text-center pb-2">
								<CardTitle className="font-display text-xl">{plan.name}</CardTitle>
								<CardDescription className="mt-4">
									<span className="text-4xl font-display font-bold text-foreground">
										R$ {plan.price}
									</span>
									<span className="text-muted-foreground">/mês</span>
								</CardDescription>
							</CardHeader>

							<CardContent className="flex-1">
								<p className="text-sm font-medium mb-4 text-center text-muted-foreground">
									Inclui:
								</p>
								<ul className="space-y-3">
									{plan.features.map((feature) => (
										<li key={feature} className="flex items-start gap-2">
											<Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
											<span className="text-sm">{feature}</span>
										</li>
									))}
								</ul>
							</CardContent>

							<CardFooter>
								<SignedOut>
									<SignInButton forceRedirectUrl="/dashboard/subscription">
										<Button
											className="w-full"
											variant={index === 1 ? "default" : "outline"}
										>
											Começar agora
											<ArrowRight className="h-4 w-4 ml-2" />
										</Button>
									</SignInButton>
								</SignedOut>
								<SignedIn>
									<Button
										asChild
										className="w-full"
										variant={index === 1 ? "default" : "outline"}
									>
										<Link href="/dashboard/subscription">
											Assinar plano
											<ArrowRight className="h-4 w-4 ml-2" />
										</Link>
									</Button>
								</SignedIn>
							</CardFooter>
						</Card>
					))}
				</div>

				<div className="text-center mt-12">
					<p className="text-muted-foreground">
						Precisa de um plano personalizado?{" "}
						<Link href="/company" className="text-primary hover:underline">
							Entre em contato
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
