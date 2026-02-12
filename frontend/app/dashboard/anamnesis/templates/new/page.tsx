"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormBuilder } from "@/components/anamnesis/form-builder";
import { type Section } from "@/lib/api/anamnesis-server";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewTemplatePage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [sections, setSections] = useState<Section[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError("Template name is required");
			return;
		}

		if (sections.length === 0) {
			setError("Add at least one section to the form");
			return;
		}

		const hasEmptySection = sections.some((s) => !s.title.trim());
		if (hasEmptySection) {
			setError("All sections must have a title");
			return;
		}

		const hasEmptyQuestion = sections.some((s) =>
			s.questions.some((q) => !q.label.trim())
		);
		if (hasEmptyQuestion) {
			setError("All questions must have a label");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/anamnesis/templates", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, description, sections }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to create template");
			}

			router.push("/dashboard/anamnesis");
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto max-w-4xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">New Anamnesis Template</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Create a reusable health history form.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/dashboard/anamnesis">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Link>
				</Button>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Template Details</CardTitle>
						<CardDescription>
							Basic information about this anamnesis form.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="name">Template Name *</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., General Health Assessment"
								required
							/>
						</div>
						<div>
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Brief description of what this form covers..."
								rows={2}
							/>
						</div>
					</CardContent>
				</Card>

				<div>
					<h2 className="text-xl font-semibold mb-4">Form Sections</h2>
					<FormBuilder sections={sections} onChange={setSections} />
				</div>

				{error && (
					<div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
						{error}
					</div>
				)}

				<div className="flex justify-end gap-3">
					<Button type="button" variant="outline" asChild>
						<Link href="/dashboard/anamnesis">Cancel</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						<Save className="h-4 w-4 mr-2" />
						{isSubmitting ? "Creating..." : "Create Template"}
					</Button>
				</div>
			</form>
		</div>
	);
}
