"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { UploadDropzone } from "@/components/exams/upload-dropzone";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface PageProps {
	params: Promise<{ id: string }>;
}

const EXAM_TYPES = [
	{ value: "blood_test", label: "Blood Test" },
	{ value: "urine_test", label: "Urine Test" },
	{ value: "imaging", label: "Imaging (X-Ray, CT, MRI)" },
	{ value: "ecg", label: "ECG / EKG" },
	{ value: "ultrasound", label: "Ultrasound" },
	{ value: "biopsy", label: "Biopsy" },
	{ value: "other", label: "Other" },
];

export default function UploadExamPage({ params }: PageProps) {
	const { id: patientId } = use(params);
	const router = useRouter();
	const [name, setName] = useState("");
	const [examType, setExamType] = useState("");
	const [uploadedFiles, setUploadedFiles] = useState<
		{ url: string; name: string; size: number }[]
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError("Exam name is required");
			return;
		}

		if (!examType) {
			setError("Please select an exam type");
			return;
		}

		setIsSubmitting(true);

		try {
			const file = uploadedFiles[0];
			const response = await fetch("/api/exams", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					patientId,
					name,
					type: examType,
					fileUrl: file?.url,
					fileName: file?.name,
					fileSize: file?.size,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to create exam");
			}

			const exam = await response.json();
			router.push(`/dashboard/patients/${patientId}/exams/${exam.id}`);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto max-w-2xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">Upload Exam</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Add a new exam result for this patient.
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href={`/dashboard/patients/${patientId}/exams`}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Link>
				</Button>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Exam Details</CardTitle>
						<CardDescription>
							Enter information about this exam.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<Label htmlFor="name">Exam Name *</Label>
							<Input
								id="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Complete Blood Count - January 2024"
								required
							/>
						</div>
						<div>
							<Label htmlFor="type">Exam Type *</Label>
							<Select value={examType} onValueChange={setExamType} required>
								<SelectTrigger>
									<SelectValue placeholder="Select exam type" />
								</SelectTrigger>
								<SelectContent>
									{EXAM_TYPES.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Upload File</CardTitle>
						<CardDescription>
							Upload the exam result file (optional). Supported formats: PDF, PNG, JPEG.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<UploadDropzone
							onUploadComplete={(files) => setUploadedFiles(files)}
							maxFiles={1}
						/>
					</CardContent>
				</Card>

				{error && (
					<div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
						{error}
					</div>
				)}

				<div className="flex justify-end gap-3">
					<Button type="button" variant="outline" asChild>
						<Link href={`/dashboard/patients/${patientId}/exams`}>Cancel</Link>
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						<Save className="h-4 w-4 mr-2" />
						{isSubmitting ? "Creating..." : "Create Exam"}
					</Button>
				</div>
			</form>
		</div>
	);
}
