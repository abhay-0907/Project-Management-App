"use client";

import { Button as ButtonPrimitive } from "react-aria-components";
import { Icon } from "@/components/shared/icon";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type DropdownSelectOption = {
  value: string;
  label: string;
  isDisabled?: boolean;
};

export type DropdownSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly DropdownSelectOption[];
  ariaLabel: string;
  id?: string;
  placeholder?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  className?: string;
};

export function DropdownSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  id,
  placeholder = "Select an option",
  isDisabled = false,
  isRequired = false,
  className,
}: DropdownSelectProps) {
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedKeys = selectedIndex < 0 ? new Set<string>() : new Set([`option-${selectedIndex}`]);
  const selectedLabel = selectedIndex < 0 ? placeholder : options[selectedIndex].label;

  return (
    <DropdownMenuTrigger>
      <ButtonPrimitive
        aria-label={ariaLabel}
        className={cn("dropdown-select-trigger", className)}
        id={id}
        aria-required={isRequired || undefined}
        isDisabled={isDisabled}
        type="button"
      >
        <span className="dropdown-select-value">{selectedLabel}</span>
        <Icon aria-hidden="true" className="dropdown-select-chevron" name="chevron-down" size={15} />
      </ButtonPrimitive>
      <DropdownMenu
        aria-label={ariaLabel}
        className="dropdown-select-menu"
        onSelectionChange={(keys) => {
          if (keys === "all") return;
          const selectedKey = Array.from(keys)[0];
          if (selectedKey === undefined) return;
          const index = Number(String(selectedKey).replace("option-", ""));
          const option = options[index];
          if (option && !option.isDisabled) onValueChange(option.value);
        }}
        selectedKeys={selectedKeys}
        selectionMode="single"
      >
        {options.map((option, index) => (
          <DropdownMenuItem
            className="dropdown-select-option"
            id={`option-${index}`}
            isDisabled={option.isDisabled}
            key={`${option.value}-${index}`}
            textValue={option.label}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
