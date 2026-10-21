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
            <div className="modal-box bg-brand-navy-light border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 mb-6 text-sm text-white/60">{message}</p>
                <div className="flex justify-end gap-2">
                    <form method="dialog">
                        <button className="inline-flex items-center px-4 py-2 rounded-lg border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/5 hover:text-white transition-all">
                            Cancel
                        </button>
                    </form>
                    <button
                        type="button"
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-[0.99] ${
                            isDestructive
                                ? "bg-error text-white hover:brightness-90"
                                : "bg-brand-green text-brand-navy hover:brightness-90"
                        }`}
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
