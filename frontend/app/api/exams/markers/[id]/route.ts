import { updateMarker, deleteMarker } from "@/lib/api/exams-server";
import { NextResponse } from "next/server";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const marker = await updateMarker({ id, ...body });
		return NextResponse.json(marker);
	} catch (error) {
		console.error("Failed to update marker:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to update marker" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const result = await deleteMarker(id);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Failed to delete marker:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to delete marker" },
			{ status: 500 }
		);
	}
}
