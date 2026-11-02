"use client";

import {
  Button as AstryxButton,
  type ButtonProps as AstryxButtonProps,
} from "@astryxdesign/core/Button";
import type { ComponentPropsWithRef } from "react";

export type ButtonSize = "sm" | "md" | "lg" | "compact" | "default" | "large";
export type ButtonVariant =
  "primary" | "secondary" | "destructive" | "ghost" | "danger-ghost" | "link";

function normalizedSize(size: ButtonSize = "md"): "sm" | "md" | "lg" {
  if (size === "compact") return "sm";
  if (size === "large") return "lg";
  return size === "default" ? "md" : size;
}

export type ButtonProps = Omit<AstryxButtonProps, "size"> & {
  size?: ButtonSize;
  disabled?: boolean;
};

/** Labeled actions use Astryx's loading, tooltip, and link behavior. */
export function Button({ disabled, isDisabled, size, ...props }: ButtonProps) {
  return (
    <AstryxButton
      {...props}
      data-qollab-button=""
      size={normalizedSize(size)}
      isDisabled={disabled || isDisabled}
    />
  );
}

export type IconButtonProps = Omit<ButtonProps, "isIconOnly">;

export function IconButton({ variant = "ghost", ...props }: IconButtonProps) {
  return <Button {...props} variant={variant} isIconOnly />;
}

export type ButtonControlProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant | "custom";
  size?: ButtonSize;
};

/**
 * Native-content controls share the theme without changing their content or
 * inferring loading from disabled/busy. Callers own accessible names and spinners.
 */
export function ButtonControl({
  variant = "secondary",
  size,
  className = "",
  type = "button",
  ...props
}: ButtonControlProps) {
  return (
    <button
      {...props}
      type={type}
      data-variant={variant}
      data-size={normalizedSize(size)}
      data-qollab-button=""
      className={`${variant === "custom" ? "" : `astryx-button ${variant} ${normalizedSize(size)}`} ${className}`}
    />
  );
}
