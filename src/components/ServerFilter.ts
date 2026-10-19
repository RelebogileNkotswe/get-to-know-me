"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { IPageRequest } from "../models/Paging";

/** How long typing must pause before the list is searched, so the list does not reload on every keystroke. */
const TYPING_DELAY_MS = 300;

/** A list filter with its page: every value is text or a number, and a default value means that filter is not used. */
type ListFilter<TFilter> = { [K in keyof TFilter]: string | number } & IPageRequest;

export interface IServerFilter<TFilter> {
    /** What the filter inputs show. Text typed into a search box shows at once, ahead of the list. */
    inputs: TFilter;
    /** True while the server loads the list for a new filter. */
    isLoading: boolean;
    /** For a search box: the list reloads once typing pauses. */
    typeText: <K extends keyof TFilter>(field: K, value: TFilter[K]) => void;
    /** For a dropdown, date picker or page button: the list reloads at once. */
    choose: <K extends keyof TFilter>(field: K, value: TFilter[K]) => void;
    /** Resets every filter to its default and reloads the list. */
    clear: () => void;
}

function isSameFilter<TFilter extends ListFilter<TFilter>>(first: TFilter, second: TFilter): boolean {
    return (Object.keys(first) as (keyof TFilter)[]).every((key: keyof TFilter) => first[key] === second[key]);
}

function trimValues<TFilter extends ListFilter<TFilter>>(filter: TFilter): TFilter {
    const result: TFilter = { ...filter };
    for (const key of Object.keys(result) as (keyof TFilter)[]) {
        const value: string | number = result[key];
        if (typeof value === "string") {
            result[key] = value.trim() as TFilter[keyof TFilter];
        }
    }
    return result;
}

/**
 * Keeps a list's filter in the page address, so the server does the filtering and a filtered list can be bookmarked or
 * shared. `filter` is what the page read from the address, `pathFor` builds the address for a filter, and
 * `emptyFilter` is the filter with nothing chosen.
 */
export function useServerFilter<TFilter extends ListFilter<TFilter>>(
    filter: TFilter,
    pathFor: (filter: TFilter) => string,
    emptyFilter: TFilter,
): IServerFilter<TFilter> {
    const router = useRouter();
    const [isLoading, startLoading] = useTransition();
    const [inputs, setInputs] = useState<TFilter>(filter);
    // The filter these inputs last put in the page address.
    const [requestedFilter, setRequestedFilter] = useState<TFilter>(filter);
    const typingTimer = useRef<number | undefined>(undefined);

    // The address changed from somewhere else, such as a menu link to the unfiltered list, so the inputs follow it.
    if (!isLoading && !isSameFilter(filter, requestedFilter)) {
        setRequestedFilter(filter);
        setInputs(filter);
    }

    // A search still waiting to run when the page is left would navigate back to the list.
    useEffect(() => () => window.clearTimeout(typingTimer.current), []);

    function loadList(next: TFilter): void {
        const requested: TFilter = trimValues(next);
        if (isSameFilter(requested, requestedFilter)) {
            return;
        }
        setRequestedFilter(requested);
        startLoading(() => router.replace(pathFor(requested), { scroll: false }));
    }

    // Any change other than the page number starts again from the first page, because the old page may no longer exist.
    function withChange<K extends keyof TFilter>(field: K, value: TFilter[K]): TFilter {
        return { ...inputs, [field]: value, ...(field === "page" ? {} : { page: 1 }) } as TFilter;
    }

    function typeText<K extends keyof TFilter>(field: K, value: TFilter[K]): void {
        const next: TFilter = withChange(field, value);
        setInputs(next);
        window.clearTimeout(typingTimer.current);
        typingTimer.current = window.setTimeout(() => loadList(next), TYPING_DELAY_MS);
    }

    function choose<K extends keyof TFilter>(field: K, value: TFilter[K]): void {
        const next: TFilter = withChange(field, value);
        setInputs(next);
        window.clearTimeout(typingTimer.current);
        loadList(next);
    }

    function clear(): void {
        setInputs(emptyFilter);
        window.clearTimeout(typingTimer.current);
        loadList(emptyFilter);
    }

    return { inputs, isLoading, typeText, choose, clear };
}
