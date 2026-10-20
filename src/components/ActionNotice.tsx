import Icon from "./Icon";

interface IActionNoticeProps {
    message: string;
    onDismiss: () => void;
}

/**
 * Dismissible message confirming an action that has just been carried out.
 */
export default function ActionNotice({ message, onDismiss }: IActionNoticeProps) {
    return (
        <div role="status" className="flex items-center gap-3 bg-brand-green/10 border border-brand-green/30 rounded-xl px-5 py-3 mb-4">
            <Icon name="check_circle" className="text-brand-green shrink-0" />
            <span className="text-sm text-white/80 flex-1">{message}</span>
            <button
                type="button"
                className="text-white/40 hover:text-white transition-colors shrink-0"
                aria-label="Dismiss"
                onClick={onDismiss}
            >
                <Icon name="close" />
            </button>
        </div>
    );
}
