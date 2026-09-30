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
        <div role="status" className="alert alert-success alert-soft mb-4">
            <span>{message}</span>
            <button type="button" className="btn btn-ghost btn-xs btn-circle" aria-label="Dismiss" onClick={onDismiss}>
                <Icon name="close" />
            </button>
        </div>
    );
}
