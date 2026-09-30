"use client";

import { useEffect, useRef } from "react";

interface IConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel: string;
    /** Styles the confirm button as a destructive action. */
    isDestructive?: boolean;
    onConfirm: () => void;
    /** Called when the dialog is closed without confirming (Cancel, Escape or a click outside). */
    onCancel: () => void;
}

/**
 * Modal confirmation dialog. Render it only while a confirmation is pending; it opens when mounted.
 */
export default function ConfirmDialog({
    title,
    message,
    confirmLabel,
    isDestructive = false,
    onConfirm,
    onCancel,
}: IConfirmDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog: HTMLDialogElement | null = dialogRef.current;
        if (dialog && !dialog.open) {
            dialog.showModal();
        }
    }, []);

    return (
        <dialog ref={dialogRef} className="modal" onClose={onCancel}>
            <div className="modal-box">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="py-4">{message}</p>
                <div className="modal-action">
                    <form method="dialog">
                        <button className="btn btn-ghost">Cancel</button>
                    </form>
                    <button
                        type="button"
                        className={`btn ${isDestructive ? "btn-error" : "btn-primary"}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button aria-label="Close">close</button>
            </form>
        </dialog>
    );
}
