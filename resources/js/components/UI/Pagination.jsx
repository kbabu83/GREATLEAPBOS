import React from 'react';

export default function Pagination({ meta, onPageChange }) {
    if (!meta || meta.last_page <= 1) return null;

    const pages = Array.from({ length: meta.last_page }, (_, i) => i + 1);
    const visiblePages = pages.filter(
        (p) => p === 1 || p === meta.last_page || Math.abs(p - meta.current_page) <= 1
    );

    return (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
                Showing {(meta.current_page - 1) * meta.per_page + 1}–
                {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total?.toLocaleString()} results
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(meta.current_page - 1)}
                    disabled={meta.current_page === 1}
                    className="px-2.5 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    ←
                </button>

                {visiblePages.map((page, i) => {
                    const prev = visiblePages[i - 1];
                    return (
                        <React.Fragment key={page}>
                            {prev && page - prev > 1 && (
                                <span className="px-1 text-gray-400">…</span>
                            )}
                            <button
                                onClick={() => onPageChange(page)}
                                className={`
                                    px-3 py-1.5 text-sm rounded-lg transition-colors
                                    ${page === meta.current_page
                                        ? 'bg-primary text-white font-medium'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }
                                `}
                            >
                                {page}
                            </button>
                        </React.Fragment>
                    );
                })}

                <button
                    onClick={() => onPageChange(meta.current_page + 1)}
                    disabled={meta.current_page === meta.last_page}
                    className="px-2.5 py-1.5 text-sm rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    →
                </button>
            </div>
        </div>
    );
}
