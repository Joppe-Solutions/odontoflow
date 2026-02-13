import { cn } from "@/lib/cn";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClientProvider } from "./query-client-provider";

import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
	variable: "--font-plus-jakarta",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		template: "%s | OdontoFlow",
		default: "OdontoFlow",
	},
	description:
		"Plataforma de gestão clínica para odontologia integrativa.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<body className={cn("antialiased", inter.variable, plusJakartaSans.variable)}>
				<ClerkProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="light"
						enableSystem
						disableTransitionOnChange
					>
						<QueryClientProvider>{children}</QueryClientProvider>
						<Toaster />
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
