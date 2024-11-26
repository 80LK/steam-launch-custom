enum ConfigureState {
	NO, YES_NOT_WRITE, YES
}
interface GameCardProps {
	id: number;
	title: string;
	downloaded: boolean;
	configured: ConfigureState;
}

export { ConfigureState };
export type { GameCardProps };
