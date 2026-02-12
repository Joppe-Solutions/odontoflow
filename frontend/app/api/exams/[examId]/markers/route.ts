import { addMarker } from "@/lib/api/exams-server";
import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ examId: string }> }
) {
	try {
		const { examId } = await params;
		const body = await request.json();
		const marker = await addMarker({ examId, ...body });
		return NextResponse.json(marker);
	} catch (error) {
		console.error("Failed to add marker:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to add marker" },
			{ status: 500 }
		);
	}
}
