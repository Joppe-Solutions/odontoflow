import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
	ArrowRight,
	Brain,
	ClipboardList,
	FileSearch,
	Heart,
	Pill,
	Users,
} from "lucide-react";
import Link from "next/link";

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-16 items-center justify-between">
				<Link href="/" className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
						<Heart className="h-4 w-4 text-primary-foreground" />
					</div>
					<span className="text-xl font-display font-bold">OdontoFlow</span>
				</Link>

				<NavigationMenu className="hidden md:flex">
					<NavigationMenuList>
						<NavigationMenuItem>
							<NavigationMenuTrigger>Funcionalidades</NavigationMenuTrigger>
							<NavigationMenuContent>
								<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
									<li>
										<NavigationMenuLink asChild>
											<Link
												href="/#features"
												className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
											>
												<div className="flex items-center gap-2">
													<Users className="h-4 w-4 text-primary" />
													<span className="text-sm font-medium leading-none">Pacientes</span>
												</div>
												<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
													Gestão completa de prontuários e histórico clínico.
												</p>
											</Link>
										</NavigationMenuLink>
									</li>
									<li>
										<NavigationMenuLink asChild>
											<Link
												href="/#features"
												className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
											>
												<div className="flex items-center gap-2">
													<ClipboardList className="h-4 w-4 text-primary" />
													<span className="text-sm font-medium leading-none">Anamnese</span>
												</div>
												<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
													Formulários digitais preenchidos pelo paciente.
												</p>
											</Link>
										</NavigationMenuLink>
									</li>
									<li>
										<NavigationMenuLink asChild>
											<Link
												href="/#features"
												className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
											>
												<div className="flex items-center gap-2">
													<FileSearch className="h-4 w-4 text-primary" />
													<span className="text-sm font-medium leading-none">Exames</span>
												</div>
												<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
													Upload e análise de exames com IA.
												</p>
											</Link>
										</NavigationMenuLink>
									</li>
									<li>
										<NavigationMenuLink asChild>
											<Link
												href="/#features"
												className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
											>
												<div className="flex items-center gap-2">
													<Brain className="h-4 w-4 text-primary" />
													<span className="text-sm font-medium leading-none">Diagnóstico</span>
												</div>
												<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
													Sugestões inteligentes baseadas em dados clínicos.
												</p>
											</Link>
										</NavigationMenuLink>
									</li>
									<li>
										<NavigationMenuLink asChild>
											<Link
												href="/#features"
												className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
											>
												<div className="flex items-center gap-2">
													<Pill className="h-4 w-4 text-primary" />
													<span className="text-sm font-medium leading-none">Prescrições</span>
												</div>
												<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
													Receitas digitais com assinatura eletrônica.
												</p>
											</Link>
										</NavigationMenuLink>
									</li>
								</ul>
							</NavigationMenuContent>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<Link href="/pricing" legacyBehavior passHref>
								<NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
									Planos
								</NavigationMenuLink>
							</Link>
						</NavigationMenuItem>

						<NavigationMenuItem>
							<Link href="/company" legacyBehavior passHref>
								<NavigationMenuLink className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
									Sobre
								</NavigationMenuLink>
							</Link>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>

				<div className="flex items-center gap-4">
					<SignedOut>
						<SignInButton forceRedirectUrl="/dashboard">
							<Button>
								Entrar
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</SignInButton>
					</SignedOut>
					<SignedIn>
						<Button asChild variant="outline">
							<Link href="/dashboard">
								Dashboard
								<ArrowRight className="ml-2 h-4 w-4" />
							</Link>
						</Button>
						<UserButton />
					</SignedIn>
				</div>
			</div>
		</header>
	);
}
