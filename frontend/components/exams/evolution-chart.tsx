"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type MarkerEvolutionPoint } from "@/lib/api/exams-server";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	ReferenceLine,
} from "recharts";

interface EvolutionChartProps {
	markerName: string;
	points: MarkerEvolutionPoint[];
	referenceMin?: number;
	referenceMax?: number;
	availableMarkers: string[];
	onMarkerChange: (markerName: string) => void;
}

export function EvolutionChart({
	markerName,
	points,
	referenceMin,
	referenceMax,
	availableMarkers,
	onMarkerChange,
}: EvolutionChartProps) {
	const chartData = points.map((point) => ({
		date: new Date(point.examDate).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		}),
		value: point.value,
		examName: point.examName,
		unit: point.unit,
		status: point.status,
	}));

	const unit = points[0]?.unit;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Marker Evolution</CardTitle>
						<CardDescription>
							Track changes in marker values over time
						</CardDescription>
					</div>
					<Select value={markerName} onValueChange={onMarkerChange}>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Select marker" />
						</SelectTrigger>
						<SelectContent>
							{availableMarkers.map((name) => (
								<SelectItem key={name} value={name}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				{points.length === 0 ? (
					<div className="h-64 flex items-center justify-center text-muted-foreground">
						{availableMarkers.length === 0
							? "No markers available for this patient."
							: "Select a marker to view its evolution."}
					</div>
				) : (
					<div className="h-64">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart
								data={chartData}
								margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
							>
								<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
								<XAxis
									dataKey="date"
									className="text-xs"
									tick={{ fill: "hsl(var(--muted-foreground))" }}
								/>
								<YAxis
									className="text-xs"
									tick={{ fill: "hsl(var(--muted-foreground))" }}
									label={
										unit
											? {
													value: unit,
													angle: -90,
													position: "insideLeft",
													fill: "hsl(var(--muted-foreground))",
											  }
											: undefined
									}
								/>
								<Tooltip
									contentStyle={{
										backgroundColor: "hsl(var(--card))",
										border: "1px solid hsl(var(--border))",
										borderRadius: "0.5rem",
									}}
									labelStyle={{ color: "hsl(var(--foreground))" }}
									formatter={(value: number) => [
										`${value}${unit ? ` ${unit}` : ""}`,
										markerName,
									]}
								/>
								{referenceMin !== undefined && (
									<ReferenceLine
										y={referenceMin}
										stroke="hsl(var(--muted-foreground))"
										strokeDasharray="5 5"
										label={{
											value: "Min",
											fill: "hsl(var(--muted-foreground))",
											fontSize: 10,
										}}
									/>
								)}
								{referenceMax !== undefined && (
									<ReferenceLine
										y={referenceMax}
										stroke="hsl(var(--muted-foreground))"
										strokeDasharray="5 5"
										label={{
											value: "Max",
											fill: "hsl(var(--muted-foreground))",
											fontSize: 10,
										}}
									/>
								)}
								<Line
									type="monotone"
									dataKey="value"
									stroke="hsl(var(--primary))"
									strokeWidth={2}
									dot={{
										fill: "hsl(var(--primary))",
										strokeWidth: 2,
									}}
									activeDot={{
										r: 6,
										fill: "hsl(var(--primary))",
									}}
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
