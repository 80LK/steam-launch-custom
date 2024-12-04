type ExcludeFields<T, U> = {
	[P in keyof T as Exclude<P, U>]: T[P];
};

export type { ExcludeFields };
