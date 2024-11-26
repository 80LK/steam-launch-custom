export default function sleep(ms: number) {
	return new Promise<void>(r => setTimeout(() => r(), ms));
}
