import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost" | "cta" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

type ButtonAsButton = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> & {
    href?: never;
  };

type ButtonAsLink = ButtonBaseProps & {
  href: string;
  target?: string;
  rel?: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-es-green text-white hover:bg-es-green-light active:bg-es-green-dark",
  secondary:
    "bg-transparent border-2 border-es-green text-es-green hover:bg-es-green hover:text-white",
  ghost:
    "bg-transparent text-es-green hover:bg-es-green/10",
  cta: "bg-es-gold text-white hover:bg-es-gold-dark active:bg-es-gold-dark shadow-lg hover:shadow-xl",
  danger:
    "bg-es-error text-white hover:bg-red-700 active:bg-red-800",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-es-green/50 focus:ring-offset-2";
  const styles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if ("href" in props && props.href) {
    const { href, target, rel, ...rest } = props;
    return (
      <Link href={href} target={target} rel={rel} className={styles} {...rest}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={styles} {...buttonProps}>
      {children}
    </button>
  );
}
