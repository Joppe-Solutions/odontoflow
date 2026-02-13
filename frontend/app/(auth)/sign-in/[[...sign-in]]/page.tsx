import { Heart, Shield, Stethoscope } from "lucide-react";
import { SignIn } from "@clerk/nextjs";

/**
 * This page renders the Clerk SignIn component.
 * See https://clerk.com/docs/components/authentication/sign-in for more information.
 */
export default function SignInPage() {
	return (
		<div className="flex min-h-screen">
			<div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
							<Heart className="h-5 w-5 text-sidebar-primary-foreground" />
						</div>
						<span className="text-2xl font-display font-bold text-sidebar-foreground">
							OdontoFlow
						</span>
					</div>
					<p className="text-sidebar-foreground/60 text-sm mt-1">
						Odontologia Integrativa
					</p>
				</div>

				<div className="space-y-8">
					<div className="flex items-start gap-4">
						<div className="h-10 w-10 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
							<Stethoscope className="h-5 w-5 text-sidebar-primary" />
						</div>
						<div>
							<h3 className="text-sidebar-foreground font-semibold">
								Gestão clínica completa
							</h3>
							<p className="text-sidebar-foreground/60 text-sm mt-1">
								Prontuário, anamnese, exames e prescrições em um só lugar.
							</p>
						</div>
					</div>
					<div className="flex items-start gap-4">
						<div className="h-10 w-10 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
							<Shield className="h-5 w-5 text-sidebar-primary" />
						</div>
						<div>
							<h3 className="text-sidebar-foreground font-semibold">Segurança LGPD</h3>
							<p className="text-sidebar-foreground/60 text-sm mt-1">
								Dados clínicos protegidos com criptografia e controle de acesso.
							</p>
						</div>
					</div>
				</div>

				<p className="text-sidebar-foreground/40 text-xs">
					© 2026 OdontoFlow. Todos os direitos reservados.
				</p>
			</div>

			<div className="flex-1 flex items-center justify-center p-6 bg-background">
				<SignIn
					appearance={{
						elements: {
							rootBox: "w-full max-w-md",
							card: "shadow-lg border border-border/50 rounded-xl bg-card",
							headerTitle: "font-display text-xl",
							footerAction: "text-sm",
						},
					}}
				/>
			</div>
		</div>
	);
}
