import { EventEmitter } from "events";

enum ServiceState {
	INITALIZATION,
	READY,
	FAIL
}

interface ServiceEventsMap {
	// Send current state
	state: [ServiceState, string]
}
abstract class Service extends EventEmitter<ServiceEventsMap> {
	protected constructor(public readonly name: string) {
		super();
	}

	private _state: ServiceState = ServiceState.INITALIZATION;
	public get state() { return this._state }
	private _message: string = "Initalization";
	public get message() { return this._message }

	protected setState(message: string): this;
	protected setState(state: ServiceState, message: string): this;
	protected setState(state: ServiceState | string, message: string = ""): this {
		if (typeof state == "string") {
			message = state;
			state = this._state;
		}

		this._state = state;
		this._message = message;
		this.emit('state', state, message);
		return this;
	}

	protected abstract _init(): Promise<void> | void;

	public async init() {
		this.setState(ServiceState.INITALIZATION, "Initalization");
		await this._init();
		this.setState(ServiceState.READY, "Ready");
	}

}

export default Service;
export { ServiceState }
