"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedFile {
	file: File;
	progress: number;
	status: "uploading" | "processing" | "complete" | "error";
	error?: string;
	url?: string;
}

interface UploadDropzoneProps {
	onUploadComplete: (files: { url: string; name: string; size: number }[]) => void;
	onUploadStart?: () => void;
	maxFiles?: number;
	acceptedTypes?: string[];
}

export function UploadDropzone({
	onUploadComplete,
	onUploadStart,
	maxFiles = 5,
	acceptedTypes = ["application/pdf", "image/png", "image/jpeg"],
}: UploadDropzoneProps) {
	const [files, setFiles] = useState<UploadedFile[]>([]);

	const uploadFile = async (file: File): Promise<string> => {
		// For now, we'll simulate upload - in production, this would upload to S3/R2
		// and return the URL
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				// Simulate processing delay
				setTimeout(() => {
					// In production, this would be the actual uploaded file URL
					resolve(`data:${file.type};base64,${btoa(reader.result as string)}`);
				}, 1000);
			};
			reader.onerror = () => reject(new Error("Failed to read file"));
			reader.readAsBinaryString(file);
		});
	};

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			if (onUploadStart) onUploadStart();

			const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
				file,
				progress: 0,
				status: "uploading" as const,
			}));

			setFiles((prev) => [...prev, ...newFiles]);

			const completedFiles: { url: string; name: string; size: number }[] = [];

			for (let i = 0; i < acceptedFiles.length; i++) {
				const file = acceptedFiles[i];
				const fileIndex = files.length + i;

				try {
					// Simulate progress
					for (let p = 0; p <= 100; p += 20) {
						await new Promise((r) => setTimeout(r, 100));
						setFiles((prev) =>
							prev.map((f, idx) =>
								idx === fileIndex ? { ...f, progress: p } : f
							)
						);
					}

					// Update to processing
					setFiles((prev) =>
						prev.map((f, idx) =>
							idx === fileIndex ? { ...f, status: "processing" } : f
						)
					);

					const url = await uploadFile(file);

					setFiles((prev) =>
						prev.map((f, idx) =>
							idx === fileIndex ? { ...f, status: "complete", url } : f
						)
					);

					completedFiles.push({
						url,
						name: file.name,
						size: file.size,
					});
				} catch (error) {
					setFiles((prev) =>
						prev.map((f, idx) =>
							idx === fileIndex
								? {
										...f,
										status: "error",
										error: error instanceof Error ? error.message : "Upload failed",
								  }
								: f
						)
					);
				}
			}

			if (completedFiles.length > 0) {
				onUploadComplete(completedFiles);
			}
		},
		[files.length, onUploadComplete, onUploadStart]
	);

	const removeFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
		maxFiles,
	});

	return (
		<div className="space-y-4">
			<div
				{...getRootProps()}
				className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
					isDragActive
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-primary/50"
				}`}
			>
				<input {...getInputProps()} />
				<Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
				{isDragActive ? (
					<p className="text-primary">Drop the files here...</p>
				) : (
					<div>
						<p className="text-muted-foreground">
							Drag & drop exam files here, or click to select
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Supports PDF, PNG, JPEG (max {maxFiles} files)
						</p>
					</div>
				)}
			</div>

			{files.length > 0 && (
				<div className="space-y-2">
					{files.map((uploadedFile, index) => (
						<Card key={index}>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<FileText className="h-8 w-8 text-muted-foreground" />
									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm truncate">
											{uploadedFile.file.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{(uploadedFile.file.size / 1024).toFixed(1)} KB
										</p>
										{uploadedFile.status === "uploading" && (
											<Progress value={uploadedFile.progress} className="h-1 mt-2" />
										)}
										{uploadedFile.status === "processing" && (
											<p className="text-xs text-blue-500 mt-1">Processing...</p>
										)}
										{uploadedFile.status === "error" && (
											<p className="text-xs text-destructive mt-1">
												{uploadedFile.error}
											</p>
										)}
									</div>
									<div className="flex items-center gap-2">
										{uploadedFile.status === "complete" && (
											<CheckCircle className="h-5 w-5 text-green-500" />
										)}
										{uploadedFile.status === "error" && (
											<AlertCircle className="h-5 w-5 text-destructive" />
										)}
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removeFile(index)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
