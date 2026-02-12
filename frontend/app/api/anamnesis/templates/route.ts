import { createTemplate } from "@/lib/api/anamnesis-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const template = await createTemplate(body);
		return NextResponse.json(template);
	} catch (error) {
		console.error("Failed to create template:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to create template" },
			{ status: 500 }
		);
	}
}
