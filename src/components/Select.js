import React from "react";
import ReactSelect from "react-select";

export default function Select({
    label,
    value,
    onChange,
    options = [],
    placeholder = "Selecione...",
}) {
    const selectedOption = options.find((opt) => opt.value === value) || null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {label && (
                <label
                    style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#334155",
                    }}
                >
                    {label}
                </label>
            )}

            <ReactSelect
                value={selectedOption}
                onChange={(selected) => onChange(selected?.value)}
                options={options}
                placeholder={placeholder}
                styles={{
                    control: (base, state) => ({
                        ...base,
                        borderRadius: 10,
                        borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
                        boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(59,130,246,0.2)"
                            : "0 1px 2px rgba(0,0,0,0.05)",
                        padding: "2px",
                        fontSize: 14,
                    }),
                    menu: (base) => ({
                        ...base,
                        borderRadius: 10,
                        overflow: "hidden",
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? "#f1f5f9" : "#fff",
                        color: "#1e293b",
                        cursor: "pointer",
                    }),
                }}
            />
        </div>
    );
}