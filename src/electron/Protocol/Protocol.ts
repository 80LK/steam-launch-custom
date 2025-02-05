abstract class Protocol {
	public constructor(public readonly protocol: string) {
		this.handle = this.handle.bind(this);
	}

	public abstract handle(request: GlobalRequest): Promise<GlobalResponse> | GlobalResponse;
}

export default Protocol;
