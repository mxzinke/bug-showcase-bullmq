export function updateHealthJob(installationID: string): Promise<void> {
	return new Promise<void>((_, reject) => {
		console.log(Date.now(), "UPDATE-HEALTH at", installationID);

		// Always failing, returning after 500ms
		const err = new Error("Update health always fails...");
		setTimeout(() => reject(err), 500);
	});
}

export function updateSensorsJob(installationID: string): Promise<void> {
	return new Promise<void>((resolve) => {
		console.log(Date.now(), "UPDATE-SENSORS at", installationID);

		// Always success, returning after 500ms
		setTimeout(resolve, 500);
	});
}
