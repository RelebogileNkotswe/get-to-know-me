"use client";

import { useId } from "react";
import { DayPicker } from "react-day-picker";
import { ClientUtils } from "../utils/ClientUtils";
import Icon from "./Icon";

interface IDatePickerProps {
    /** Text shown on the picker button and used to name the clear button, e.g. "Started on or after". */
    label: string;
    /** When true, the button shows only the chosen date, not the label, once a date is picked. */
    valueOnly?: boolean;
    /** Selected date as an ISO date string (e.g. 2026-09-14), or an empty string for no date. */
    value: string;
    onChange: (value: string) => void;
}

/**
 * Date picker: a DaisyUI input-styled button that opens a React Day Picker calendar in a popover.
 */
export default function DatePicker({ label, valueOnly = false, value, onChange }: IDatePickerProps) {
    // Each picker gets its own popover id and CSS anchor name, so several pickers can share a page.
    const id: string = useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const popoverId: string = `date-picker-popover-${id}`;
    const anchorName: string = `--date-picker-${id}`;
    const selectedDate: Date | undefined = ClientUtils.fromIsoDate(value);

    function handleSelect(date: Date | undefined): void {
        onChange(date ? ClientUtils.toIsoDate(date) : "");
        document.getElementById(popoverId)?.hidePopover();
    }

    function handleClear(): void {
        onChange("");
    }

    return (
        <>
            <div className="join" style={{ anchorName }}>
                <button type="button" className="input join-item" popoverTarget={popoverId} aria-label={label}>
                    <Icon name="calendar_month" />
                    {selectedDate ? (valueOnly ? value : `${label} ${value}`) : label}
                </button>
                {selectedDate && (
                    <button type="button" className="btn join-item" aria-label={`Clear ${label}`} onClick={handleClear}>
                        <Icon name="close" />
                    </button>
                )}
            </div>
            <div
                popover="auto"
                id={popoverId}
                className="dropdown bg-base-100 rounded-box shadow-lg"
                style={{ positionAnchor: anchorName }}
            >
                <DayPicker className="react-day-picker" mode="single" selected={selectedDate} onSelect={handleSelect} />
            </div>
        </>
    );
}
