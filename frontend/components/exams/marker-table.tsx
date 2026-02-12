"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { type ExamMarker, type MarkerStatus } from "@/lib/api/exams-server";
import { Pencil, Trash2, Plus, TrendingUp, TrendingDown, Minus } from "lucide-react";

const STATUS_CONFIG: Record<
	MarkerStatus,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
	normal: { label: "Normal", variant: "outline", icon: <Minus className="h-3 w-3" /> },
	low: { label: "Low", variant: "secondary", icon: <TrendingDown className="h-3 w-3" /> },
	high: { label: "High", variant: "default", icon: <TrendingUp className="h-3 w-3" /> },
	critical: { label: "Critical", variant: "destructive", icon: null },
};

interface MarkerTableProps {
	markers: ExamMarker[];
	onUpdate: (id: string, data: Partial<ExamMarker>) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onAdd: (data: { name: string; value?: number; unit?: string; referenceMin?: number; referenceMax?: number }) => Promise<void>;
}

function AddMarkerDialog({ onAdd }: { onAdd: MarkerTableProps["onAdd"] }) {
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [value, setValue] = useState("");
	const [unit, setUnit] = useState("");
	const [refMin, setRefMin] = useState("");
	const [refMax, setRefMax] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) return;

		setIsSubmitting(true);
		try {
			await onAdd({
				name: name.trim(),
				value: value ? parseFloat(value) : undefined,
				unit: unit.trim() || undefined,
				referenceMin: refMin ? parseFloat(refMin) : undefined,
				referenceMax: refMax ? parseFloat(refMax) : undefined,
			});
			setOpen(false);
			setName("");
			setValue("");
			setUnit("");
			setRefMin("");
			setRefMax("");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Plus className="h-4 w-4 mr-2" />
					Add Marker
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Marker</DialogTitle>
					<DialogDescription>
						Add a new marker to this exam.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<Label htmlFor="name">Marker Name *</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Hemoglobin"
							required
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="value">Value</Label>
							<Input
								id="value"
								type="number"
								step="any"
								value={value}
								onChange={(e) => setValue(e.target.value)}
								placeholder="12.5"
							/>
						</div>
						<div>
							<Label htmlFor="unit">Unit</Label>
							<Input
								id="unit"
								value={unit}
								onChange={(e) => setUnit(e.target.value)}
								placeholder="g/dL"
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<Label htmlFor="refMin">Reference Min</Label>
							<Input
								id="refMin"
								type="number"
								step="any"
								value={refMin}
								onChange={(e) => setRefMin(e.target.value)}
								placeholder="12.0"
							/>
						</div>
						<div>
							<Label htmlFor="refMax">Reference Max</Label>
							<Input
								id="refMax"
								type="number"
								step="any"
								value={refMax}
								onChange={(e) => setRefMax(e.target.value)}
								placeholder="16.0"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Adding..." : "Add Marker"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function EditableCell({
	value,
	onChange,
	type = "text",
}: {
	value: string | number | undefined;
	onChange: (value: string) => void;
	type?: "text" | "number";
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(String(value ?? ""));

	const handleBlur = () => {
		setIsEditing(false);
		onChange(editValue);
	};

	if (isEditing) {
		return (
			<Input
				type={type}
				step="any"
				value={editValue}
				onChange={(e) => setEditValue(e.target.value)}
				onBlur={handleBlur}
				onKeyDown={(e) => e.key === "Enter" && handleBlur()}
				autoFocus
				className="h-8 w-24"
			/>
		);
	}

	return (
		<span
			className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
			onClick={() => setIsEditing(true)}
		>
			{value ?? "-"}
		</span>
	);
}

export function MarkerTable({ markers, onUpdate, onDelete, onAdd }: MarkerTableProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			await onDelete(id);
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<AddMarkerDialog onAdd={onAdd} />
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Marker</TableHead>
						<TableHead>Value</TableHead>
						<TableHead>Unit</TableHead>
						<TableHead>Reference Range</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Source</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{markers.length === 0 ? (
						<TableRow>
							<TableCell colSpan={7} className="text-center text-muted-foreground">
								No markers found. Add markers manually or process OCR.
							</TableCell>
						</TableRow>
					) : (
						markers.map((marker) => {
							const statusConfig = marker.status
								? STATUS_CONFIG[marker.status]
								: null;

							return (
								<TableRow key={marker.id}>
									<TableCell className="font-medium">{marker.name}</TableCell>
									<TableCell>
										<EditableCell
											value={marker.value}
											type="number"
											onChange={(val) =>
												onUpdate(marker.id, {
													value: val ? parseFloat(val) : undefined,
												})
											}
										/>
									</TableCell>
									<TableCell>
										<EditableCell
											value={marker.unit}
											onChange={(val) =>
												onUpdate(marker.id, { unit: val || undefined })
											}
										/>
									</TableCell>
									<TableCell>
										{marker.referenceMin !== undefined ||
										marker.referenceMax !== undefined ? (
											<span className="text-muted-foreground text-sm">
												{marker.referenceMin ?? "?"} - {marker.referenceMax ?? "?"}
											</span>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>
										{statusConfig ? (
											<Badge variant={statusConfig.variant} className="gap-1">
												{statusConfig.icon}
												{statusConfig.label}
											</Badge>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>
										<Badge variant="outline" className="text-xs">
											{marker.source === "ocr" ? "OCR" : "Manual"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(marker.id)}
											disabled={deletingId === marker.id}
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
		</div>
	);
}
