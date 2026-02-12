"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarkerTable } from "@/components/exams/marker-table";
import { EvolutionChart } from "@/components/exams/evolution-chart";
import { type Patient } from "@/lib/api/patients-server";
import {
	type ExamWithMarkers,
	type ExamMarker,
	type MarkerEvolutionResponse,
	type ExamStatus,
} from "@/lib/api/exams-server";
import { ArrowLeft, FileText, BarChart3, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface ExamDetailClientProps {
	patient: Patient;
	exam: ExamWithMarkers;
	markerNames: string[];
	initialEvolution: MarkerEvolutionResponse | null;
	selectedMarker?: string;
}

const STATUS_CONFIG: Record<
	ExamStatus,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
	pending: { label: "Pending", variant: "secondary", icon: <Clock className="h-3 w-3" /> },
	processing: { label: "Processing", variant: "default", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
	ready: { label: "Ready", variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
	error: { label: "Error", variant: "destructive", icon: <AlertCircle className="h-3 w-3" /> },
};

export function ExamDetailClient({
	patient,
	exam: initialExam,
	markerNames: initialMarkerNames,
	initialEvolution,
	selectedMarker: initialSelectedMarker,
}: ExamDetailClientProps) {
	const router = useRouter();
	const [exam, setExam] = useState(initialExam);
	const [evolution, setEvolution] = useState(initialEvolution);
	const [selectedMarker, setSelectedMarker] = useState(initialSelectedMarker || "");
	const [markerNames, setMarkerNames] = useState(initialMarkerNames);

	const statusConfig = STATUS_CONFIG[exam.status];

	const handleUpdateMarker = async (
		id: string,
		data: Partial<ExamMarker>
	): Promise<void> => {
		const response = await fetch(`/api/exams/markers/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ id, ...data }),
		});

		if (!response.ok) {
			throw new Error("Failed to update marker");
		}

		const updatedMarker = await response.json();
		setExam((prev) => ({
			...prev,
			markers: prev.markers.map((m) =>
				m.id === id ? updatedMarker : m
			),
		}));
	};

	const handleDeleteMarker = async (id: string): Promise<void> => {
		const response = await fetch(`/api/exams/markers/${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error("Failed to delete marker");
		}

		setExam((prev) => ({
			...prev,
			markers: prev.markers.filter((m) => m.id !== id),
		}));
	};

	const handleAddMarker = async (data: {
		name: string;
		value?: number;
		unit?: string;
		referenceMin?: number;
		referenceMax?: number;
	}): Promise<void> => {
		const response = await fetch(`/api/exams/${exam.id}/markers`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ examId: exam.id, ...data }),
		});

		if (!response.ok) {
			throw new Error("Failed to add marker");
		}

		const newMarker = await response.json();
		setExam((prev) => ({
			...prev,
			markers: [...prev.markers, newMarker],
		}));

		// Update marker names list if this is a new marker name
		if (!markerNames.includes(data.name)) {
			setMarkerNames((prev) => [...prev, data.name].sort());
		}
	};

	const handleMarkerChange = async (markerName: string) => {
		setSelectedMarker(markerName);

		const response = await fetch(
			`/api/exams/patient/${patient.id}/evolution/${encodeURIComponent(markerName)}`
		);

		if (response.ok) {
			const data = await response.json();
			setEvolution(data);
		}
	};

	return (
		<div className="container mx-auto max-w-6xl space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-semibold">{exam.name}</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						{patient.name} - {new Date(exam.createdAt).toLocaleDateString("en-US")}
					</p>
				</div>
				<Button asChild variant="outline">
					<Link href={`/dashboard/patients/${patient.id}/exams`}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Exams
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Status
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant={statusConfig.variant} className="gap-1">
							{statusConfig.icon}
							{statusConfig.label}
						</Badge>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Type
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Badge variant="outline">{exam.type}</Badge>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Markers
						</CardTitle>
					</CardHeader>
					<CardContent>
						<span className="text-2xl font-bold">{exam.markers.length}</span>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="markers">
				<TabsList>
					<TabsTrigger value="markers">
						<FileText className="h-4 w-4 mr-2" />
						Markers
					</TabsTrigger>
					<TabsTrigger value="evolution">
						<BarChart3 className="h-4 w-4 mr-2" />
						Evolution
					</TabsTrigger>
					{exam.ocrRaw && (
						<TabsTrigger value="ocr">
							OCR Raw Text
						</TabsTrigger>
					)}
				</TabsList>

				<TabsContent value="markers" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Exam Markers</CardTitle>
							<CardDescription>
								Review and curate the extracted markers from this exam.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<MarkerTable
								markers={exam.markers}
								onUpdate={handleUpdateMarker}
								onDelete={handleDeleteMarker}
								onAdd={handleAddMarker}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="evolution" className="mt-4">
					<EvolutionChart
						markerName={selectedMarker}
						points={evolution?.points || []}
						availableMarkers={markerNames}
						onMarkerChange={handleMarkerChange}
					/>
				</TabsContent>

				{exam.ocrRaw && (
					<TabsContent value="ocr" className="mt-4">
						<Card>
							<CardHeader>
								<CardTitle>OCR Raw Text</CardTitle>
								<CardDescription>
									Raw text extracted from the exam document.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap overflow-auto max-h-96">
									{exam.ocrRaw}
								</pre>
							</CardContent>
						</Card>
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
}
