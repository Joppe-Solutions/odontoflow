import { api } from "encore.dev/api";
import log from "encore.dev/log";
import { listSubmissions } from "../anamnesis/anamnesis";
import { listExams } from "../exams/exams";
import { listPatients } from "../patients/patients";
import { listPrescriptions } from "../prescription/prescription";
import { getSubscription } from "../subscription/stripe";

interface DashboardData {
	// Legacy fields used by the generated frontend client typings.
	totalUsers: number;
	totalOrders: number;
	totalRevenue: number;
	// Real dashboard metrics.
	totalPatients: number;
	activePatients: number;
	archivedPatients: number;
	totalExams: number;
	readyExams: number;
	processingExams: number;
	pendingExams: number;
	errorExams: number;
	totalAnamnesisSubmissions: number;
	completedSubmissions: number;
	inProgressSubmissions: number;
	pendingSubmissions: number;
	expiredSubmissions: number;
	totalPrescriptions: number;
	draftPrescriptions: number;
	signedPrescriptions: number;
	cancelledPrescriptions: number;
	hasActiveSubscription: boolean;
	activeSubscriptionPriceId?: string;
}

/**
 * Returns real dashboard metrics for the currently authenticated organization.
 */
export const getDashboardData = api(
	{ method: "GET", expose: true, auth: true },
	async (): Promise<DashboardData> => {
		const [
			patientsAll,
			patientsActive,
			patientsArchived,
			examsAll,
			examsReady,
			examsProcessing,
			examsPending,
			examsError,
			submissionsAll,
			submissionsCompleted,
			submissionsInProgress,
			submissionsPending,
			submissionsExpired,
			prescriptionsAll,
			prescriptionsDraft,
			prescriptionsSigned,
			prescriptionsCancelled,
		] = await Promise.all([
			listPatients({ limit: 1, offset: 0 }),
			listPatients({ status: "active", limit: 1, offset: 0 }),
			listPatients({ status: "archived", limit: 1, offset: 0 }),
			listExams({ limit: 1, offset: 0 }),
			listExams({ status: "ready", limit: 1, offset: 0 }),
			listExams({ status: "processing", limit: 1, offset: 0 }),
			listExams({ status: "pending", limit: 1, offset: 0 }),
			listExams({ status: "error", limit: 1, offset: 0 }),
			listSubmissions({ limit: 1, offset: 0 }),
			listSubmissions({ status: "completed", limit: 1, offset: 0 }),
			listSubmissions({ status: "in_progress", limit: 1, offset: 0 }),
			listSubmissions({ status: "pending", limit: 1, offset: 0 }),
			listSubmissions({ status: "expired", limit: 1, offset: 0 }),
			listPrescriptions({ limit: 1, offset: 0 }),
			listPrescriptions({ status: "draft", limit: 1, offset: 0 }),
			listPrescriptions({ status: "signed", limit: 1, offset: 0 }),
			listPrescriptions({ status: "cancelled", limit: 1, offset: 0 }),
		]);

		let hasActiveSubscription = false;
		let activeSubscriptionPriceId: string | undefined;
		try {
			const subscription = await getSubscription();
			hasActiveSubscription = true;
			activeSubscriptionPriceId = subscription.priceId;
		} catch (error) {
			// Subscription can legitimately be absent for free-trial flows.
			log.debug("subscription not available for dashboard", { error });
		}

		return {
			// Legacy keys mapped to real business data.
			totalUsers: patientsAll.total,
			totalOrders: examsAll.total,
			totalRevenue: submissionsCompleted.total,
			totalPatients: patientsAll.total,
			activePatients: patientsActive.total,
			archivedPatients: patientsArchived.total,
			totalExams: examsAll.total,
			readyExams: examsReady.total,
			processingExams: examsProcessing.total,
			pendingExams: examsPending.total,
			errorExams: examsError.total,
			totalAnamnesisSubmissions: submissionsAll.total,
			completedSubmissions: submissionsCompleted.total,
			inProgressSubmissions: submissionsInProgress.total,
			pendingSubmissions: submissionsPending.total,
			expiredSubmissions: submissionsExpired.total,
			totalPrescriptions: prescriptionsAll.total,
			draftPrescriptions: prescriptionsDraft.total,
			signedPrescriptions: prescriptionsSigned.total,
			cancelledPrescriptions: prescriptionsCancelled.total,
			hasActiveSubscription,
			activeSubscriptionPriceId,
		};
	},
);
