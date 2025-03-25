addEventListener('error', (event) => {
	event.preventDefault();
	Logger.error(event.error.message);
})
addEventListener('unhandledrejection', (event) => {
	event.preventDefault();
	Logger.error(event.reason);
})
