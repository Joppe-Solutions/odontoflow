import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import {
	ArrowRight,
	Brain,
	CalendarCheck,
	CheckCircle2,
	ClipboardList,
	FileSearch,
	Heart,
	Lock,
	Pill,
	Shield,
	Sparkles,
	Stethoscope,
	Users,
} from "lucide-react";

const features = [
	{
		icon: Users,
		title: "Gestão de Pacientes",
		description: "Cadastro completo com histórico médico, anamnese e prontuário eletrônico integrado.",
	},
	{
		icon: ClipboardList,
		title: "Anamnese Digital",
		description: "Formulários personalizáveis enviados por link. O paciente preenche antes da consulta.",
	},
	{
		icon: FileSearch,
		title: "Exames e Laudos",
		description: "Upload de exames com análise assistida por IA para identificar padrões e achados.",
	},
	{
		icon: Brain,
		title: "Diagnóstico Assistido",
		description: "Sugestões inteligentes baseadas em anamnese, exames e histórico do paciente.",
	},
	{
		icon: Pill,
		title: "Prescrições Digitais",
		description: "Emissão de receitas com assinatura digital, integração com farmácias e histórico.",
	},
	{
		icon: CalendarCheck,
		title: "Agenda Inteligente",
		description: "Confirmação automática, lembretes por WhatsApp e gestão de retornos.",
	},
];

const benefits = [
	"Reduza o tempo de consulta em até 40%",
	"Anamnese preenchida pelo paciente antes da consulta",
	"Prontuário eletrônico completo e seguro",
	"Integração com exames laboratoriais",
	"Prescrições com assinatura digital",
	"Conformidade total com LGPD",
];

export default function Home() {
	return (
		<div className="flex flex-col">
			{/* Hero Section */}
			<section className="relative py-20 md:py-32 overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
				<div className="container relative">
					<div className="flex flex-col items-center text-center max-w-4xl mx-auto">
						<Badge variant="secondary" className="mb-6">
							<Sparkles className="h-3 w-3 mr-1" />
							Odontologia Integrativa com IA
						</Badge>

						<h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-6">
							Gestão clínica completa para{" "}
							<span className="text-primary">odontologia integrativa</span>
						</h1>

						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
							Prontuário eletrônico, anamnese digital, diagnóstico assistido por IA e
							prescrições com assinatura digital. Tudo em uma única plataforma.
						</p>

						<div className="flex flex-col sm:flex-row gap-4">
							<SignedOut>
								<SignInButton forceRedirectUrl="/dashboard">
									<Button size="lg" className="text-base px-8">
										Começar agora
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</SignInButton>
							</SignedOut>
							<SignedIn>
								<Button asChild size="lg" className="text-base px-8">
									<Link href="/dashboard">
										Acessar Dashboard
										<ArrowRight className="ml-2 h-4 w-4" />
									</Link>
								</Button>
							</SignedIn>
							<Button asChild variant="outline" size="lg" className="text-base px-8">
								<Link href="/pricing">Ver planos</Link>
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 bg-muted/30">
				<div className="container">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
							Tudo que sua clínica precisa
						</h2>
						<p className="text-muted-foreground text-lg max-w-2xl mx-auto">
							Ferramentas modernas para otimizar o atendimento e melhorar a experiência
							dos seus pacientes.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
								<CardHeader>
									<div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
										<feature.icon className="h-6 w-6 text-primary" />
									</div>
									<CardTitle className="text-xl font-display">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base">{feature.description}</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="py-20">
				<div className="container">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div>
							<h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
								Por que escolher o OdontoFlow?
							</h2>
							<p className="text-muted-foreground text-lg mb-8">
								Desenvolvido por dentistas para dentistas. Nossa plataforma entende
								as necessidades reais de uma clínica odontológica integrativa.
							</p>

							<ul className="space-y-4">
								{benefits.map((benefit) => (
									<li key={benefit} className="flex items-start gap-3">
										<CheckCircle2 className="h-5 w-5 text-success mt-0.5 shrink-0" />
										<span>{benefit}</span>
									</li>
								))}
							</ul>
						</div>

						<div className="relative">
							<Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
								<CardHeader className="pb-4">
									<div className="flex items-center gap-3">
										<div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
											<Heart className="h-5 w-5 text-primary-foreground" />
										</div>
										<div>
											<CardTitle className="text-lg font-display">OdontoFlow</CardTitle>
											<CardDescription>Odontologia Integrativa</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="flex items-center justify-between p-4 bg-card rounded-lg">
										<div className="flex items-center gap-3">
											<Stethoscope className="h-5 w-5 text-primary" />
											<span className="font-medium">Consultas hoje</span>
										</div>
										<span className="text-2xl font-display font-bold">12</span>
									</div>
									<div className="flex items-center justify-between p-4 bg-card rounded-lg">
										<div className="flex items-center gap-3">
											<ClipboardList className="h-5 w-5 text-info" />
											<span className="font-medium">Anamneses pendentes</span>
										</div>
										<span className="text-2xl font-display font-bold">3</span>
									</div>
									<div className="flex items-center justify-between p-4 bg-card rounded-lg">
										<div className="flex items-center gap-3">
											<FileSearch className="h-5 w-5 text-warning" />
											<span className="font-medium">Exames para análise</span>
										</div>
										<span className="text-2xl font-display font-bold">5</span>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</section>

			{/* Security Section */}
			<section className="py-20 bg-sidebar text-sidebar-foreground">
				<div className="container">
					<div className="flex flex-col md:flex-row items-center justify-between gap-8">
						<div className="flex items-center gap-6">
							<div className="h-16 w-16 rounded-2xl bg-sidebar-primary/20 flex items-center justify-center">
								<Shield className="h-8 w-8 text-sidebar-primary" />
							</div>
							<div>
								<h3 className="text-xl font-display font-bold text-sidebar-foreground">
									Segurança e Conformidade
								</h3>
								<p className="text-sidebar-foreground/70">
									Dados clínicos protegidos com criptografia de ponta a ponta
								</p>
							</div>
						</div>
						<div className="flex items-center gap-8">
							<div className="flex items-center gap-2">
								<Lock className="h-5 w-5 text-sidebar-primary" />
								<span className="text-sm font-medium">LGPD Compliant</span>
							</div>
							<div className="flex items-center gap-2">
								<Shield className="h-5 w-5 text-sidebar-primary" />
								<span className="text-sm font-medium">CFO/CRO</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20">
				<div className="container">
					<Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
						<CardContent className="py-12 px-8 md:px-16">
							<div className="flex flex-col md:flex-row items-center justify-between gap-8">
								<div>
									<h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
										Pronto para transformar sua clínica?
									</h2>
									<p className="text-primary-foreground/80">
										Comece gratuitamente e veja a diferença na sua rotina.
									</p>
								</div>
								<SignedOut>
									<SignInButton forceRedirectUrl="/dashboard">
										<Button size="lg" variant="secondary" className="text-base px-8 shrink-0">
											Criar conta gratuita
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
									</SignInButton>
								</SignedOut>
								<SignedIn>
									<Button asChild size="lg" variant="secondary" className="text-base px-8 shrink-0">
										<Link href="/dashboard">
											Ir para o Dashboard
											<ArrowRight className="ml-2 h-4 w-4" />
										</Link>
									</Button>
								</SignedIn>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Footer */}
			<footer className="py-8 border-t">
				<div className="container">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<Heart className="h-5 w-5 text-primary" />
							<span className="font-display font-bold">OdontoFlow</span>
						</div>
						<p className="text-sm text-muted-foreground">
							© 2026 OdontoFlow. Todos os direitos reservados.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
