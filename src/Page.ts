enum Pages {
	MAIN = 'main',
	LAUNCH = 'launch'
}

export default Pages;
function getCurrentPage(): Pages {
	return <Pages>App.page;
}
export { getCurrentPage };
