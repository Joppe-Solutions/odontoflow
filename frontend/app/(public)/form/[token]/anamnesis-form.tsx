"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { type Section, type Question } from "@/lib/api/anamnesis-server";
import { CheckCircle, Clock } from "lucide-react";

interface AnamnesisFormProps {
	token: string;
	template: {
		name: string;
		description?: string;
		sections: Section[];
	};
	initialResponses?: Record<string, unknown>;
	expiresAt: string;
}

function QuestionField({
	question,
	value,
	onChange,
}: {
	question: Question;
	value: unknown;
	onChange: (value: unknown) => void;
}) {
	const id = `q-${question.id}`;

	switch (question.type) {
		case "text":
			return (
				<Input
					id={id}
					value={(value as string) || ""}
					onChange={(e) => onChange(e.target.value)}
					required={question.required}
				/>
			);

		case "textarea":
			return (
				<Textarea
					id={id}
					value={(value as string) || ""}
					onChange={(e) => onChange(e.target.value)}
					required={question.required}
					rows={4}
				/>
			);

		case "number":
			return (
				<Input
					id={id}
					type="number"
					value={(value as number) ?? ""}
					onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
					required={question.required}
				/>
			);

		case "date":
			return (
				<Input
					id={id}
					type="date"
					value={(value as string) || ""}
					onChange={(e) => onChange(e.target.value)}
					required={question.required}
				/>
			);

		case "select":
			return (
				<Select value={(value as string) || ""} onValueChange={onChange}>
					<SelectTrigger>
						<SelectValue placeholder="Select an option..." />
					</SelectTrigger>
					<SelectContent>
						{question.options?.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);

		case "radio":
			return (
				<RadioGroup value={(value as string) || ""} onValueChange={onChange}>
					{question.options?.map((option) => (
						<div key={option} className="flex items-center space-x-2">
							<RadioGroupItem value={option} id={`${id}-${option}`} />
							<Label htmlFor={`${id}-${option}`} className="cursor-pointer">
								{option}
							</Label>
						</div>
					))}
				</RadioGroup>
			);

		case "checkbox":
		case "multiselect":
			const selectedValues = (value as string[]) || [];
			return (
				<div className="space-y-2">
					{question.options?.map((option) => (
						<div key={option} className="flex items-center space-x-2">
							<Checkbox
								id={`${id}-${option}`}
								checked={selectedValues.includes(option)}
								onCheckedChange={(checked) => {
									if (checked) {
										onChange([...selectedValues, option]);
									} else {
										onChange(selectedValues.filter((v) => v !== option));
									}
								}}
							/>
							<Label htmlFor={`${id}-${option}`} className="cursor-pointer">
								{option}
							</Label>
						</div>
					))}
				</div>
			);

		case "scale":
			const min = question.min ?? 1;
			const max = question.max ?? 10;
			const scaleOptions = Array.from({ length: max - min + 1 }, (_, i) => min + i);
			return (
				<div className="flex gap-2 flex-wrap">
					{scaleOptions.map((num) => (
						<Button
							key={num}
							type="button"
							variant={value === num ? "default" : "outline"}
							size="sm"
							className="w-10 h-10"
							onClick={() => onChange(num)}
						>
							{num}
						</Button>
					))}
				</div>
			);

		default:
			return null;
	}
}

export function AnamnesisForm({
	token,
	template,
	initialResponses,
	expiresAt,
}: AnamnesisFormProps) {
	const [currentSection, setCurrentSection] = useState(0);
	const [responses, setResponses] = useState<Record<string, unknown>>(
		initialResponses || {}
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	const totalQuestions = template.sections.reduce(
		(acc, section) => acc + section.questions.length,
		0
	);

	const answeredQuestions = Object.keys(responses).filter(
		(key) => responses[key] !== undefined && responses[key] !== ""
	).length;

	const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

	const saveDraft = useCallback(async () => {
		try {
			const res = await fetch(`/api/anamnesis/form/${token}/draft`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ responses }),
			});
			if (res.ok) {
				setLastSaved(new Date());
			}
		} catch {
			// Silent fail for draft saves
		}
	}, [token, responses]);

	// Auto-save draft every 30 seconds
	useEffect(() => {
		const interval = setInterval(saveDraft, 30000);
		return () => clearInterval(interval);
	}, [saveDraft]);

	// Save draft on section change
	useEffect(() => {
		saveDraft();
	}, [currentSection, saveDraft]);

	const handleSubmit = async () => {
		setError(null);
		setIsSubmitting(true);

		// Validate required fields
		const missingRequired: string[] = [];
		template.sections.forEach((section) => {
			section.questions.forEach((question) => {
				if (question.required) {
					const value = responses[question.id];
					if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
						missingRequired.push(question.label);
					}
				}
			});
		});

		if (missingRequired.length > 0) {
			setError(`Please answer the following required questions: ${missingRequired.join(", ")}`);
			setIsSubmitting(false);
			return;
		}

		try {
			const res = await fetch(`/api/anamnesis/form/${token}/submit`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ responses }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to submit form");
			}

			setIsSubmitted(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isSubmitted) {
		return (
			<Card className="text-center">
				<CardContent className="pt-12 pb-12">
					<CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
					<h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
					<p className="text-muted-foreground">
						Your health history form has been submitted successfully.
						Your healthcare provider will review your responses.
					</p>
				</CardContent>
			</Card>
		);
	}

	const section = template.sections[currentSection];
	const isLastSection = currentSection === template.sections.length - 1;
	const isFirstSection = currentSection === 0;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{template.name}</CardTitle>
					{template.description && (
						<CardDescription>{template.description}</CardDescription>
					)}
					<div className="flex items-center gap-4 mt-4">
						<Progress value={progress} className="flex-1" />
						<span className="text-sm text-muted-foreground">
							{Math.round(progress)}% complete
						</span>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
						<Clock className="h-3 w-3" />
						Expires: {new Date(expiresAt).toLocaleString()}
						{lastSaved && (
							<span className="ml-4">
								Last saved: {lastSaved.toLocaleTimeString()}
							</span>
						)}
					</div>
				</CardHeader>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-lg">
								{section.title}
								<span className="text-muted-foreground font-normal ml-2">
									(Section {currentSection + 1} of {template.sections.length})
								</span>
							</CardTitle>
							{section.description && (
								<CardDescription>{section.description}</CardDescription>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{section.questions.map((question) => (
						<div key={question.id} className="space-y-2">
							<Label htmlFor={`q-${question.id}`}>
								{question.label}
								{question.required && <span className="text-destructive ml-1">*</span>}
							</Label>
							{question.description && (
								<p className="text-sm text-muted-foreground">{question.description}</p>
							)}
							<QuestionField
								question={question}
								value={responses[question.id]}
								onChange={(value) =>
									setResponses((prev) => ({ ...prev, [question.id]: value }))
								}
							/>
						</div>
					))}
				</CardContent>
			</Card>

			{error && (
				<div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
					{error}
				</div>
			)}

			<div className="flex justify-between">
				<Button
					variant="outline"
					onClick={() => setCurrentSection((prev) => prev - 1)}
					disabled={isFirstSection}
				>
					Previous
				</Button>
				{isLastSection ? (
					<Button onClick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Submitting..." : "Submit Form"}
					</Button>
				) : (
					<Button onClick={() => setCurrentSection((prev) => prev + 1)}>
						Next
					</Button>
				)}
			</div>
		</div>
	);
}
