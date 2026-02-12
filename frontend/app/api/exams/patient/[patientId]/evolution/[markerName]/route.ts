import { getMarkerEvolution } from "@/lib/api/exams-server";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ patientId: string; markerName: string }> }
) {
	try {
		const { patientId, markerName } = await params;
		const { searchParams } = new URL(request.url);
		const limit = searchParams.get("limit");

		const evolution = await getMarkerEvolution(
			patientId,
			decodeURIComponent(markerName),
			limit ? parseInt(limit) : undefined
		);
		return NextResponse.json(evolution);
	} catch (error) {
		console.error("Failed to get marker evolution:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to get evolution" },
			{ status: 500 }
		);
	}
}
