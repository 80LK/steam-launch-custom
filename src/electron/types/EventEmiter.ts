import { EventEmitter as NodeEventEmitter } from 'events';

interface EventMap<T extends any[]> {
	[key: string]: T;
}

type NodeEventEmitterClear = {
	[P in keyof NodeEventEmitter as Exclude<P, "on" | 'emit' | 'once' | 'off'>]: NodeEventEmitter[P];
};

interface EventEmitter<T extends EventMap<any>> extends NodeEventEmitterClear {
	on<K extends keyof T>(name: K, listener: (...args: T[K]) => void): this;
	once<K extends keyof T>(name: K, listener: (...args: T[K]) => void): this;
	off<K extends keyof T>(name: K, listener: (...args: T[K]) => void): this;
	emit<K extends keyof T>(name: K, ...args: T[K]): boolean;
}

const typed = NodeEventEmitter as { new <T extends EventMap<any>>(): EventEmitter<T> };
export default typed;
