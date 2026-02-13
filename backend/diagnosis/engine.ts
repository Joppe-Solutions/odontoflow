export type Severity = "low" | "medium" | "high";

export interface DiagnosisCondition {
	name: string;
	probability: number;
	severity: Severity;
	supportingEvidence: string[];
	contradictingEvidence: string[];
}

export interface DiagnosisInputMarker {
	name: string;
	value?: number;
	unit?: string;
	referenceMin?: number;
	referenceMax?: number;
	status?: "normal" | "low" | "high" | "critical";
	examDate: Date;
}

export interface DiagnosisInput {
	responses?: Record<string, unknown>;
	markers: DiagnosisInputMarker[];
}

export interface DiagnosisResult {
	conditions: DiagnosisCondition[];
	confidence: number;
	summary: string;
	reasoning: string;
	recommendedExams: string[];
}

function normalizeText(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim();
}

function matchesMarkerName(markerName: string, candidates: string[]): boolean {
	const normalizedMarkerName = normalizeText(markerName);
	return candidates.some((candidate) =>
		normalizedMarkerName.includes(normalizeText(candidate)),
	);
}

function getLatestMarker(
	markers: DiagnosisInputMarker[],
	candidates: string[],
): DiagnosisInputMarker | undefined {
	return markers
		.filter((marker) => matchesMarkerName(marker.name, candidates))
		.sort((a, b) => b.examDate.getTime() - a.examDate.getTime())[0];
}

function asNumber(value?: number): number | undefined {
	if (value === undefined || value === null || Number.isNaN(value)) {
		return undefined;
	}
	return value;
}

function formatMarker(marker: DiagnosisInputMarker): string {
	const value = marker.value !== undefined ? `${marker.value}` : "n/a";
	const unit = marker.unit ? ` ${marker.unit}` : "";
	if (marker.referenceMin !== undefined && marker.referenceMax !== undefined) {
		return `${marker.name}: ${value}${unit} (ref ${marker.referenceMin}-${marker.referenceMax})`;
	}
	return `${marker.name}: ${value}${unit}`;
}

function extractResponseText(responses?: Record<string, unknown>): string {
	if (!responses) return "";
	const pieces: string[] = [];

	const walk = (value: unknown) => {
		if (typeof value === "string") {
			pieces.push(value);
			return;
		}
		if (typeof value === "number" || typeof value === "boolean") {
			pieces.push(String(value));
			return;
		}
		if (Array.isArray(value)) {
			value.forEach(walk);
			return;
		}
		if (value && typeof value === "object") {
			Object.values(value as Record<string, unknown>).forEach(walk);
		}
	};

	walk(responses);
	return normalizeText(pieces.join(" "));
}

function hasAnyKeyword(haystack: string, keywords: string[]): boolean {
	return keywords.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function clampProbability(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

function pushCondition(
	conditions: DiagnosisCondition[],
	condition: DiagnosisCondition,
): void {
	conditions.push({
		...condition,
		probability: clampProbability(condition.probability),
	});
}

export function analyzeDiagnosis(input: DiagnosisInput): DiagnosisResult {
	const conditions: DiagnosisCondition[] = [];
	const recommendedExams = new Set<string>();
	const responseText = extractResponseText(input.responses);

	const fatigueSignal = hasAnyKeyword(responseText, [
		"fadiga",
		"cansaco",
		"fatigue",
		"baixa energia",
		"cansada",
		"cansado",
	]);
	const sleepSignal = hasAnyKeyword(responseText, [
		"insonia",
		"dificuldade para dormir",
		"sono ruim",
		"sleep",
	]);

	const vitaminD = getLatestMarker(input.markers, [
		"vitamin d",
		"vitamina d",
		"25-oh",
		"25 oh",
	]);
	if (!vitaminD) {
		recommendedExams.add("25-OH Vitamin D");
	} else if (asNumber(vitaminD.value) !== undefined && asNumber(vitaminD.value)! < 30) {
		const value = asNumber(vitaminD.value)!;
		pushCondition(conditions, {
			name: "Vitamin D insufficiency tendency",
			probability: value < 20 ? 88 : 74,
			severity: value < 20 ? "high" : "medium",
			supportingEvidence: [formatMarker(vitaminD)],
			contradictingEvidence: [],
		});
	}

	const ferritin = getLatestMarker(input.markers, ["ferritin", "ferritina"]);
	if (!ferritin) {
		recommendedExams.add("Ferritin");
	} else if (asNumber(ferritin.value) !== undefined && asNumber(ferritin.value)! < 30) {
		const value = asNumber(ferritin.value)!;
		pushCondition(conditions, {
			name: "Iron reserve depletion tendency",
			probability: value < 15 ? 86 : 72,
			severity: value < 15 ? "high" : "medium",
			supportingEvidence: [formatMarker(ferritin)],
			contradictingEvidence: [],
		});
	}

	const crp = getLatestMarker(input.markers, [
		"crp",
		"c-reactive protein",
		"proteina c reativa",
		"pcr",
	]);
	if (!crp) {
		recommendedExams.add("hs-CRP");
	} else if (asNumber(crp.value) !== undefined && asNumber(crp.value)! > 5) {
		const value = asNumber(crp.value)!;
		pushCondition(conditions, {
			name: "Systemic inflammatory activity",
			probability: value > 10 ? 87 : 73,
			severity: value > 10 ? "high" : "medium",
			supportingEvidence: [formatMarker(crp)],
			contradictingEvidence: [],
		});
	}

	const hba1c = getLatestMarker(input.markers, [
		"hba1c",
		"hemoglobina glicada",
		"glycated hemoglobin",
	]);
	const fastingGlucose = getLatestMarker(input.markers, [
		"glucose",
		"glicose",
		"fasting glucose",
		"glicemia",
	]);
	if (!hba1c) {
		recommendedExams.add("HbA1c");
	}
	if (!fastingGlucose) {
		recommendedExams.add("Fasting glucose");
	}

	const hba1cValue = asNumber(hba1c?.value);
	const glucoseValue = asNumber(fastingGlucose?.value);
	if ((hba1cValue !== undefined && hba1cValue >= 5.7) || (glucoseValue !== undefined && glucoseValue >= 100)) {
		const highRisk = (hba1cValue !== undefined && hba1cValue >= 6.5) || (glucoseValue !== undefined && glucoseValue >= 126);
		const evidence: string[] = [];
		if (hba1c) evidence.push(formatMarker(hba1c));
		if (fastingGlucose) evidence.push(formatMarker(fastingGlucose));

		pushCondition(conditions, {
			name: "Glycemic dysregulation tendency",
			probability: highRisk ? 90 : 76,
			severity: highRisk ? "high" : "medium",
			supportingEvidence: evidence,
			contradictingEvidence: [],
		});
	}

	const tsh = getLatestMarker(input.markers, ["tsh"]);
	const freeT4 = getLatestMarker(input.markers, ["free t4", "t4 livre"]);
	if (!tsh) {
		recommendedExams.add("TSH");
		recommendedExams.add("Free T4");
	} else {
		const tshValue = asNumber(tsh.value);
		if (tshValue !== undefined && (tshValue > 4.5 || tshValue < 0.3)) {
			const evidence: string[] = [formatMarker(tsh)];
			if (freeT4) evidence.push(formatMarker(freeT4));

			pushCondition(conditions, {
				name: "Thyroid axis dysregulation tendency",
				probability: tshValue > 10 || tshValue < 0.1 ? 84 : 69,
				severity: tshValue > 10 || tshValue < 0.1 ? "high" : "medium",
				supportingEvidence: evidence,
				contradictingEvidence: [],
			});
		}
	}

	if (fatigueSignal && conditions.length > 0) {
		conditions[0].probability = clampProbability(conditions[0].probability + 4);
		conditions[0].supportingEvidence.push("Anamnesis reports fatigue/low energy.");
	}

	if (sleepSignal && conditions.length === 0) {
		pushCondition(conditions, {
			name: "Stress-recovery imbalance tendency",
			probability: 55,
			severity: "low",
			supportingEvidence: ["Anamnesis reports sleep disturbance symptoms."],
			contradictingEvidence: [],
		});
	}

	if (input.markers.length === 0 && conditions.length === 0) {
		pushCondition(conditions, {
			name: "Insufficient laboratory data for robust hypothesis",
			probability: 42,
			severity: "low",
			supportingEvidence: ["No ready exam markers available for analysis."],
			contradictingEvidence: [],
		});
	}

	conditions.sort((a, b) => b.probability - a.probability);

	const evidenceCount = conditions.reduce(
		(total, condition) => total + condition.supportingEvidence.length,
		0,
	);

	let confidence = 35 + conditions.length * 10 + evidenceCount * 4;
	if (conditions[0]?.name.includes("Insufficient laboratory data")) {
		confidence = 40;
	}
	confidence = Math.max(30, Math.min(95, confidence));

	const topConditions = conditions.slice(0, 2).map((condition) => condition.name);
	const summary =
		topConditions.length > 0
			? `Top hypothesis: ${topConditions.join(" / ")}.`
			: "No high-signal hypothesis detected.";

	const reasoning = `Analysis used ${input.markers.length} lab marker(s) and anamnesis pattern matching. This output is clinical decision support and requires professional validation.`;

	return {
		conditions,
		confidence,
		summary,
		reasoning,
		recommendedExams: Array.from(recommendedExams),
	};
}

