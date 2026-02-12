import { saveDraft } from "@/lib/api/anamnesis-server";
import { NextResponse } from "next/server";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params;
		const body = await request.json();
		const result = await saveDraft(token, body.responses);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Failed to save draft:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to save draft" },
			{ status: 500 }
		);
	}
}
