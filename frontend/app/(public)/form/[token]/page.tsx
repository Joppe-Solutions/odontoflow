import { getFormByToken } from "@/lib/api/anamnesis-server";
import { notFound } from "next/navigation";
import { AnamnesisForm } from "./anamnesis-form";

interface PageProps {
	params: Promise<{ token: string }>;
}

export default async function PublicFormPage({ params }: PageProps) {
	const { token } = await params;

	let formData;
	try {
		formData = await getFormByToken(token);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("not found")) {
				notFound();
			}
			if (error.message.includes("expired")) {
				return (
					<div className="min-h-screen flex items-center justify-center bg-muted/30">
						<div className="max-w-md text-center p-8">
							<h1 className="text-2xl font-semibold text-destructive mb-2">
								Form Expired
							</h1>
							<p className="text-muted-foreground">
								This form link has expired. Please contact your healthcare provider
								for a new link.
							</p>
						</div>
					</div>
				);
			}
			if (error.message.includes("already been submitted")) {
				return (
					<div className="min-h-screen flex items-center justify-center bg-muted/30">
						<div className="max-w-md text-center p-8">
							<h1 className="text-2xl font-semibold text-green-600 mb-2">
								Already Submitted
							</h1>
							<p className="text-muted-foreground">
								This form has already been submitted. Thank you for your response.
							</p>
						</div>
					</div>
				);
			}
		}
		throw error;
	}

	return (
		<div className="min-h-screen bg-muted/30 py-8">
			<div className="container mx-auto max-w-2xl">
				<AnamnesisForm
					token={token}
					template={formData.template}
					initialResponses={formData.submission.responses}
					expiresAt={formData.submission.expiresAt}
				/>
			</div>
		</div>
	);
}
