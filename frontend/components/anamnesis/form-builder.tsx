"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { type Question, type QuestionType, type Section } from "@/lib/api/anamnesis-server";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
	{ value: "text", label: "Short Text" },
	{ value: "textarea", label: "Long Text" },
	{ value: "number", label: "Number" },
	{ value: "date", label: "Date" },
	{ value: "select", label: "Dropdown" },
	{ value: "multiselect", label: "Multi-select" },
	{ value: "radio", label: "Single Choice" },
	{ value: "checkbox", label: "Checkboxes" },
	{ value: "scale", label: "Scale (1-10)" },
];

interface FormBuilderProps {
	sections: Section[];
	onChange: (sections: Section[]) => void;
}

function generateId(): string {
	return Math.random().toString(36).substring(2, 9);
}

function QuestionEditor({
	question,
	onChange,
	onDelete,
}: {
	question: Question;
	onChange: (question: Question) => void;
	onDelete: () => void;
}) {
	const needsOptions = ["select", "multiselect", "radio", "checkbox"].includes(question.type);

	return (
		<div className="border rounded-lg p-4 space-y-3 bg-muted/30">
			<div className="flex items-start gap-2">
				<GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
				<div className="flex-1 space-y-3">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<Label>Question Label</Label>
							<Input
								value={question.label}
								onChange={(e) => onChange({ ...question, label: e.target.value })}
								placeholder="Enter question..."
							/>
						</div>
						<div>
							<Label>Type</Label>
							<Select
								value={question.type}
								onValueChange={(value) =>
									onChange({ ...question, type: value as QuestionType })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{QUESTION_TYPES.map((type) => (
										<SelectItem key={type.value} value={type.value}>
											{type.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div>
						<Label>Description (optional)</Label>
						<Input
							value={question.description || ""}
							onChange={(e) =>
								onChange({ ...question, description: e.target.value || undefined })
							}
							placeholder="Help text for the patient..."
						/>
					</div>

					{needsOptions && (
						<div>
							<Label>Options (one per line)</Label>
							<Textarea
								value={(question.options || []).join("\n")}
								onChange={(e) =>
									onChange({
										...question,
										options: e.target.value.split("\n").filter(Boolean),
									})
								}
								placeholder="Option 1&#10;Option 2&#10;Option 3"
								rows={3}
							/>
						</div>
					)}

					{question.type === "scale" && (
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label>Min Value</Label>
								<Input
									type="number"
									value={question.min ?? 1}
									onChange={(e) =>
										onChange({ ...question, min: parseInt(e.target.value) || 1 })
									}
								/>
							</div>
							<div>
								<Label>Max Value</Label>
								<Input
									type="number"
									value={question.max ?? 10}
									onChange={(e) =>
										onChange({ ...question, max: parseInt(e.target.value) || 10 })
									}
								/>
							</div>
						</div>
					)}

					<div className="flex items-center gap-2">
						<Checkbox
							id={`required-${question.id}`}
							checked={question.required}
							onCheckedChange={(checked) =>
								onChange({ ...question, required: checked === true })
							}
						/>
						<Label htmlFor={`required-${question.id}`} className="cursor-pointer">
							Required
						</Label>
					</div>
				</div>
				<Button variant="ghost" size="icon" onClick={onDelete}>
					<Trash2 className="h-4 w-4 text-destructive" />
				</Button>
			</div>
		</div>
	);
}

function SectionEditor({
	section,
	onChange,
	onDelete,
	isExpanded,
	onToggleExpand,
}: {
	section: Section;
	onChange: (section: Section) => void;
	onDelete: () => void;
	isExpanded: boolean;
	onToggleExpand: () => void;
}) {
	const addQuestion = () => {
		const newQuestion: Question = {
			id: generateId(),
			type: "text",
			label: "",
			required: false,
		};
		onChange({ ...section, questions: [...section.questions, newQuestion] });
	};

	const updateQuestion = (index: number, question: Question) => {
		const newQuestions = [...section.questions];
		newQuestions[index] = question;
		onChange({ ...section, questions: newQuestions });
	};

	const deleteQuestion = (index: number) => {
		onChange({
			...section,
			questions: section.questions.filter((_, i) => i !== index),
		});
	};

	return (
		<Card>
			<CardHeader className="cursor-pointer" onClick={onToggleExpand}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
						<CardTitle className="text-lg">
							{section.title || "Untitled Section"}
						</CardTitle>
						<span className="text-muted-foreground text-sm">
							({section.questions.length} questions)
						</span>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
						{isExpanded ? (
							<ChevronUp className="h-5 w-5" />
						) : (
							<ChevronDown className="h-5 w-5" />
						)}
					</div>
				</div>
			</CardHeader>

			{isExpanded && (
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<Label>Section Title</Label>
							<Input
								value={section.title}
								onChange={(e) => onChange({ ...section, title: e.target.value })}
								placeholder="e.g., Medical History"
							/>
						</div>
						<div>
							<Label>Description (optional)</Label>
							<Input
								value={section.description || ""}
								onChange={(e) =>
									onChange({ ...section, description: e.target.value || undefined })
								}
								placeholder="Brief explanation..."
							/>
						</div>
					</div>

					<div className="space-y-3">
						<Label>Questions</Label>
						{section.questions.map((question, index) => (
							<QuestionEditor
								key={question.id}
								question={question}
								onChange={(q) => updateQuestion(index, q)}
								onDelete={() => deleteQuestion(index)}
							/>
						))}
						<Button variant="outline" size="sm" onClick={addQuestion}>
							<Plus className="h-4 w-4 mr-2" />
							Add Question
						</Button>
					</div>
				</CardContent>
			)}
		</Card>
	);
}

export function FormBuilder({ sections, onChange }: FormBuilderProps) {
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(sections.map((s) => s.id))
	);

	const addSection = () => {
		const newSection: Section = {
			id: generateId(),
			title: "",
			questions: [],
		};
		onChange([...sections, newSection]);
		setExpandedSections((prev) => new Set([...prev, newSection.id]));
	};

	const updateSection = (index: number, section: Section) => {
		const newSections = [...sections];
		newSections[index] = section;
		onChange(newSections);
	};

	const deleteSection = (index: number) => {
		onChange(sections.filter((_, i) => i !== index));
	};

	const toggleExpand = (sectionId: string) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(sectionId)) {
				next.delete(sectionId);
			} else {
				next.add(sectionId);
			}
			return next;
		});
	};

	return (
		<div className="space-y-4">
			{sections.map((section, index) => (
				<SectionEditor
					key={section.id}
					section={section}
					onChange={(s) => updateSection(index, s)}
					onDelete={() => deleteSection(index)}
					isExpanded={expandedSections.has(section.id)}
					onToggleExpand={() => toggleExpand(section.id)}
				/>
			))}

			<Button variant="outline" onClick={addSection}>
				<Plus className="h-4 w-4 mr-2" />
				Add Section
			</Button>
		</div>
	);
}
