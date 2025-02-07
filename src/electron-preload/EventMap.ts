import { ipcRenderer } from 'electron'

class EventMap<T extends (...args: any[]) => void> {
	private _next_id: number = 1;
	private _eventsMap: Map<number, T> = new Map();

	constructor(event: string) {
		ipcRenderer.on(event, (_, ...args: Parameters<T>) => {
			this._eventsMap.forEach(e => e(...args));
		})
	}

	public on(callback: T): number {
		this._eventsMap.set(this._next_id++, callback);
		return this._next_id;
	}
	public off(id: number) {
		this._eventsMap.delete(id);
	}
}

export default EventMap;
