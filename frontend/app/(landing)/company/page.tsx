import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Shield, Sparkles } from "lucide-react";

const values = [
	{
		icon: Heart,
		title: "Cuidado com o paciente",
		description:
			"Acreditamos que a tecnologia deve servir para melhorar a experiência do paciente e a qualidade do atendimento.",
	},
	{
		icon: Shield,
		title: "Segurança e privacidade",
		description:
			"Dados de saúde são sensíveis. Investimos em criptografia e conformidade com LGPD para proteger seus pacientes.",
	},
	{
		icon: Users,
		title: "Feito para dentistas",
		description:
			"Nossa equipe inclui dentistas que entendem os desafios reais de uma clínica odontológica.",
	},
	{
		icon: Sparkles,
		title: "Inovação constante",
		description:
			"Utilizamos inteligência artificial e as melhores práticas de desenvolvimento para evoluir constantemente.",
	},
];

export default function CompanyPage() {
	return (
		<div className="py-20">
			<div className="container">
				<div className="text-center max-w-2xl mx-auto mb-16">
					<Badge variant="secondary" className="mb-4">
						Sobre nós
					</Badge>
					<h1 className="text-4xl font-display font-bold mb-4">
						Transformando a odontologia integrativa
					</h1>
					<p className="text-muted-foreground text-lg">
						O OdontoFlow nasceu da necessidade de ter uma ferramenta completa
						para gestão de clínicas odontológicas com foco em tratamentos integrativos.
					</p>
				</div>

				<div className="max-w-3xl mx-auto mb-16">
					<Card>
						<CardHeader>
							<CardTitle className="font-display">Nossa Missão</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground leading-relaxed">
								Empoderar dentistas e profissionais da odontologia integrativa com
								ferramentas modernas que simplificam a gestão clínica, melhoram a
								comunicação com pacientes e permitem diagnósticos mais precisos
								através de tecnologia de ponta.
							</p>
						</CardContent>
					</Card>
				</div>

				<div className="mb-16">
					<h2 className="text-2xl font-display font-bold text-center mb-8">
						Nossos Valores
					</h2>
					<div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
						{values.map((value) => (
							<Card key={value.title}>
								<CardHeader>
									<div className="flex items-center gap-3">
										<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
											<value.icon className="h-5 w-5 text-primary" />
										</div>
										<CardTitle className="text-lg font-display">{value.title}</CardTitle>
									</div>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base">{value.description}</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>

				<div className="text-center">
					<Card className="max-w-2xl mx-auto bg-muted/30">
						<CardContent className="py-8">
							<h3 className="text-xl font-display font-bold mb-2">
								Quer saber mais?
							</h3>
							<p className="text-muted-foreground mb-4">
								Entre em contato conosco para conhecer melhor nossa solução.
							</p>
							<p className="text-primary font-medium">
								contato@odontoflow.com.br
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
