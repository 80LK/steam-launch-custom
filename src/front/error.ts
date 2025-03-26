addEventListener('error', (event) => {
	event.preventDefault();
	console.error(event.error);
	Logger.error(event.error.message);
})
addEventListener('unhandledrejection', (event) => {
	event.preventDefault();
	console.error(event.reason);
	Logger.error(event.reason);
})
