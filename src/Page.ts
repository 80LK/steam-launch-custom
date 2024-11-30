enum Pages {
	MAIN = 'main',
	LAUNCH = 'launch'
}

export default Pages;
function getCurrentPage(): Pages {
	return <Pages>new URLSearchParams(location.search).get('page');
}
export { getCurrentPage };
