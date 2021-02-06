import { Queue, QueueScheduler, Worker } from "bullmq";
import { updateHealthJob, updateSensorsJob } from "./jobs";

type JobType = "UPDATE_HEALTH" | "UPDATE_SENSORS";
interface JobData {
	type: JobType;
	machine: string;
}

const QUEUE_NAME = "iot-jobs-queue";

// All available jobs, which are repeated
const JOBS: {
	[jobName in JobType]: {
		work: (installationID: string) => Promise<void>;
		every: number;
	};
} = {
	UPDATE_HEALTH: {
		// Always failing
		work: (installationID: string) => updateHealthJob(installationID),
		every: 50 * 1000, // 50 seconds
	},
	UPDATE_SENSORS: {
		// Always success
		work: (installationID: string) => updateSensorsJob(installationID),
		every: 20 * 1000, // 20 seconds
	},
};

// Let's imaging, the list of installationID's comes in real-world from a database or something like that
const INSTALLATIONS = [
	"ebc81fc2-6869-11eb-ae93-0242ac130002",
	// "404af736-1bfc-498c-bde4-9392a392f126",
	// "b32cfad5-5d5d-4895-880c-fdf1a1fd41b2",
	// ...
];

// The actual magic
const queue = new Queue<JobData, void, string>(QUEUE_NAME);
new QueueScheduler(QUEUE_NAME);

// Spawning all jobs:
Object.keys(JOBS).forEach((jobType) => {
	// ...for each installationID
	INSTALLATIONS.forEach((installationID) => {
		queue
			.add(
				`${jobType}::${installationID}`,
				{
					type: jobType as JobType,
					machine: installationID,
				},
				{
					repeat: { every: JOBS[jobType as JobType].every },
					attempts: 3,
				}
			)
			.then(() =>
				console.log("Spawned job", jobType, "for installation", installationID)
			);
	});
});

new Worker<JobData, void, string>(QUEUE_NAME, async (job) => {
	if (!INSTALLATIONS.includes(job.data.machine)) {
		return await queue.removeRepeatable(job.name, job.opts.repeat!);
	}

	await JOBS[job.data.type].work(job.data.machine);
});
