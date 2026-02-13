import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type TimelineEvent, type TimelineEventType } from "@/lib/api/patients-server";
import {
	ClipboardList,
	FileText,
	FilePlus,
	Stethoscope,
	Pill,
	StickyNote,
	RefreshCw,
	Archive,
	UserPlus,
	Edit,
	History,
} from "lucide-react";

const EVENT_ICONS: Record<TimelineEventType, React.ReactNode> = {
	created: <UserPlus className="h-4 w-4" />,
	updated: <Edit className="h-4 w-4" />,
	anamnesis_submitted: <ClipboardList className="h-4 w-4" />,
	exam_uploaded: <FilePlus className="h-4 w-4" />,
	exam_reviewed: <FileText className="h-4 w-4" />,
	diagnosis_created: <Stethoscope className="h-4 w-4" />,
	prescription_created: <Pill className="h-4 w-4" />,
	note_added: <StickyNote className="h-4 w-4" />,
	status_changed: <RefreshCw className="h-4 w-4" />,
	archived: <Archive className="h-4 w-4" />,
};

const EVENT_COLORS: Record<TimelineEventType, string> = {
	created: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
	updated: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
	anamnesis_submitted: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
	exam_uploaded: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
	exam_reviewed: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
	diagnosis_created: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
	prescription_created: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
	note_added: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
	status_changed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
	archived: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

const EVENT_LABELS: Record<TimelineEventType, string> = {
	created: "Paciente cadastrado",
	updated: "Dados atualizados",
	anamnesis_submitted: "Anamnese preenchida",
	exam_uploaded: "Exame enviado",
	exam_reviewed: "Exame revisado",
	diagnosis_created: "Diagnóstico gerado",
	prescription_created: "Prescrição criada",
	note_added: "Nota adicionada",
	status_changed: "Status alterado",
	archived: "Paciente arquivado",
};

interface PatientTimelineProps {
	events: TimelineEvent[];
	total: number;
}

export function PatientTimeline({ events, total }: PatientTimelineProps) {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
						<History className="h-5 w-5 text-muted-foreground" />
					</div>
					<div>
						<CardTitle className="text-lg font-display">Linha do Tempo</CardTitle>
						<CardDescription>
							{total} {total === 1 ? "evento registrado" : "eventos registrados"}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{events.length === 0 ? (
					<div className="text-center py-8">
						<History className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
						<p className="font-medium">Nenhuma atividade registrada</p>
						<p className="text-sm text-muted-foreground mt-1">
							As ações realizadas no prontuário aparecerão aqui.
						</p>
					</div>
				) : (
					<div className="relative">
						<div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
						<ul className="space-y-4">
							{events.map((event, index) => (
								<li key={event.id} className="relative pl-12">
									<div
										className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${EVENT_COLORS[event.eventType]}`}
									>
										{EVENT_ICONS[event.eventType]}
									</div>
									<div className="pt-0.5">
										<div className="flex items-center gap-2 flex-wrap">
											<p className="font-medium text-sm">
												{event.title || EVENT_LABELS[event.eventType]}
											</p>
											{index === 0 && (
												<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
													Mais recente
												</span>
											)}
										</div>
										{event.description && (
											<p className="text-muted-foreground text-sm mt-0.5">
												{event.description}
											</p>
										)}
										<p className="text-muted-foreground text-xs mt-1">
											{new Date(event.createdAt).toLocaleString("pt-BR", {
												dateStyle: "long",
												timeStyle: "short",
											})}
										</p>
									</div>
								</li>
							))}
						</ul>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
