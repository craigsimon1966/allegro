import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

import { buttonClasses, type ButtonVariant } from './buttonClasses';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />;
}

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant };

export function ButtonLink({ variant = 'primary', className = '', ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, className)} {...rest} />;
}
