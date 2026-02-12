import { createExam } from "@/lib/api/exams-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const exam = await createExam(body);
		return NextResponse.json(exam);
	} catch (error) {
		console.error("Failed to create exam:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to create exam" },
			{ status: 500 }
		);
	}
}
