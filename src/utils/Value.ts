class Value<T> {
	constructor(private value: T, change?: Value.ChangeHandle<T>) {
		change && this.on(change);
	}

	private _event: Set<Value.ChangeHandle<T>> = new Set();
	public on(call: Value.ChangeHandle<T>) {
		this._event.add(call);
	}
	public off(call: Value.ChangeHandle<T>) {
		this._event.delete(call);
	}
	public get(): T {
		if (typeof this.value == "function") return this.value();
		return this.value;
	}
	public set(value: T, callEvent: boolean = true) {
		const old = this.value;
		this.value = value;
		if (callEvent)
			for (const [call] of this._event.entries()) {
				call(old, value);
			}
	}
}

namespace Value {
	export interface ChangeHandle<T> {
		(old: T, cur: T): void
	}
}

export default Value;
