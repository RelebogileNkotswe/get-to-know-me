"use client";

import { DayPicker } from "react-day-picker";
import { fromIsoDate, toIsoDate } from "./DateUtils";
import Icon from "./Icon";

const POPOVER_ID = "date-picker-popover";
const ANCHOR_NAME = "--date-picker";

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
    const selectedDate: Date | undefined = fromIsoDate(value);

    function handleSelect(date: Date | undefined): void {
        onChange(date ? toIsoDate(date) : "");
        document.getElementById(POPOVER_ID)?.hidePopover();
    }

    function handleClear(): void {
        onChange("");
    }

    return (
        <>
            <div className="join" style={{ anchorName: ANCHOR_NAME }}>
                <button type="button" className="input join-item" popoverTarget={POPOVER_ID} aria-label={label}>
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
                id={POPOVER_ID}
                className="dropdown bg-base-100 rounded-box shadow-lg"
                style={{ positionAnchor: ANCHOR_NAME }}
            >
                <DayPicker className="react-day-picker" mode="single" selected={selectedDate} onSelect={handleSelect} />
            </div>
        </>
    );
}
