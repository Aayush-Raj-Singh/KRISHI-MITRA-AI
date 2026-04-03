import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

type FilterAutocompleteProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const FilterAutocomplete: React.FC<FilterAutocompleteProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled,
}) => (
  <Autocomplete
    freeSolo
    fullWidth
    openOnFocus
    autoHighlight
    options={options}
    value={value}
    inputValue={value}
    disabled={disabled}
    onInputChange={(_, newInput) => onChange(newInput)}
    onChange={(_, newValue) => onChange(typeof newValue === "string" ? newValue : newValue || "")}
    renderInput={(params) => (
      <TextField
        {...params}
        fullWidth
        label={label}
        placeholder={placeholder}
        disabled={disabled}
      />
    )}
  />
);

export default FilterAutocomplete;
