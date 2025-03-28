import { ComponentPublicInstance, FunctionalComponent } from 'vue';

type JSXComponent<Props = any> = {
	new(): ComponentPublicInstance<Props>;
} | FunctionalComponent<Props>;
type IconValue = string | (string | [path: string, opacity: number])[] | JSXComponent;

type Density = null | 'default' | 'comfortable' | 'compact';
type Variant = "filled" | "underlined" | "outlined" | "plain" | "solo" | "solo-inverted" | "solo-filled";
type ValidationResult = string | boolean;
type ValidationRule = ValidationResult | PromiseLike<ValidationResult> | ((value: any) => ValidationResult) | ((value: any) => PromiseLike<ValidationResult>);


type FieldProps = {
	readonly?: boolean;
	label?: string;
	variant?: Variant;
	density?: Density;
	clearable?: boolean;
	rules?: readonly ValidationRule[];
	prependInnerIcon?: IconValue;
	forceLabel?: boolean
};

export type { FieldProps, Variant };
