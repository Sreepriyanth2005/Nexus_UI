import { cloneElement, isValidElement, useId } from 'react';
import type { HTMLAttributes, HTMLInputTypeAttribute, ReactElement, ReactNode } from 'react';
import { cn } from '../../../lib/cn';
import { Input } from '../Input';

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: ReactNode;
  required?: boolean;
  valid?: boolean;
  type?: HTMLInputTypeAttribute;
  labelSize?: 'default' | 'lg';
  htmlFor?: string;
  children?: ReactElement;
}

export function Field({
  label,
  required = false,
  valid = false,
  type = 'text',
  labelSize = 'default',
  htmlFor,
  children,
  className,
  ...rest
}: FieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;

  let control: ReactNode;
  if (isValidElement(children)) {
    const childProps = children.props as { id?: string };
    control = cloneElement(children, { id: childProps.id ?? id } as Partial<typeof childProps>);
  } else {
    control = <Input id={id} type={type} valid={valid} />;
  }

  return (
    <div className={cn("flex flex-col gap-2 mb-6", className)} {...rest}>
      <label
        className={cn(
          "text-ink font-sans font-bold cursor-default",
          labelSize === 'lg' ? "text-[16px]" : "text-label",
          required && "after:content-['*'] after:text-danger after:ml-1"
        )}
        htmlFor={id}
      >
        {label}
      </label>
      {control}
    </div>
  );
}