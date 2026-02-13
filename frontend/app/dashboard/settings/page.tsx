import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@clerk/nextjs";
import { Cog, LogOut, Shield, User } from "lucide-react";

export default function SettingsPage() {
	return (
		<div className="space-y-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-display font-bold">Configurações</h1>
				<p className="text-muted-foreground mt-1">
					Gerencie as configurações da sua conta e preferências do sistema.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<User className="h-5 w-5 text-primary" />
							</div>
							<div>
								<CardTitle className="text-lg font-display">Conta</CardTitle>
								<CardDescription>
									Gerencie seus dados pessoais e credenciais.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							As configurações de conta são gerenciadas pelo seu provedor de autenticação.
						</p>
						<SignOutButton redirectUrl="/sign-in">
							<Button variant="outline" className="w-full">
								<LogOut className="h-4 w-4 mr-2" />
								Sair da conta
							</Button>
						</SignOutButton>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
								<Shield className="h-5 w-5 text-info" />
							</div>
							<div>
								<CardTitle className="text-lg font-display">Segurança</CardTitle>
								<CardDescription>
									Configurações de privacidade e segurança.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<span className="text-sm">Autenticação em dois fatores</span>
								<span className="text-xs text-muted-foreground">Via Clerk</span>
							</div>
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<span className="text-sm">Criptografia de dados</span>
								<span className="text-xs text-success font-medium">Ativa</span>
							</div>
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<span className="text-sm">Conformidade LGPD</span>
								<span className="text-xs text-success font-medium">Ativa</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="md:col-span-2">
					<CardHeader>
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
								<Cog className="h-5 w-5 text-warning" />
							</div>
							<div>
								<CardTitle className="text-lg font-display">Preferências do Sistema</CardTitle>
								<CardDescription>
									Personalize a experiência do OdontoFlow.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<div className="p-4 border rounded-lg">
								<p className="font-medium text-sm">Idioma</p>
								<p className="text-muted-foreground text-xs mt-1">Português (Brasil)</p>
							</div>
							<div className="p-4 border rounded-lg">
								<p className="font-medium text-sm">Fuso horário</p>
								<p className="text-muted-foreground text-xs mt-1">America/Sao_Paulo</p>
							</div>
							<div className="p-4 border rounded-lg">
								<p className="font-medium text-sm">Formato de data</p>
								<p className="text-muted-foreground text-xs mt-1">DD/MM/AAAA</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
