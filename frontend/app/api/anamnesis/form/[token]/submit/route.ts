import { submitForm } from "@/lib/api/anamnesis-server";
import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ token: string }> }
) {
	try {
		const { token } = await params;
		const body = await request.json();
		const result = await submitForm(token, body.responses);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Failed to submit form:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to submit form" },
			{ status: 500 }
		);
	}
}
