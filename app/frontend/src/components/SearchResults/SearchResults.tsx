import React from "react";
import { Stack, Text, Link, mergeStyleSets, getTheme, FontWeights, Spinner } from "@fluentui/react";
import { SearchDocument } from "../../api/models";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import styles from "./SearchResults.module.css";

interface SearchResultsProps {
    results: SearchDocument[];
    isLoading: boolean;
    error?: string;
    query?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, isLoading, error, query }) => {
    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner label="Searching..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <Text variant="mediumPlus">Error: {error}</Text>
            </div>
        );
    }

    if (!results || results.length === 0) {
        return (
            <div className={styles.noResultsContainer}>
                <Text variant="large">{query ? `No results found for "${query}"` : ""}</Text>
            </div>
        );
    }
    /*
    return (
        <div className={styles.resultContainer}>
            {query && (
                <Text variant="large" block styles={{ root: { marginBottom: "1.5em" } }}>
                    Results for: <span className={styles.queryText}>{query}</span>
                </Text>
            )}
            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { width: "100%" } }}>
                {results.map((result, index) => (
                    <Stack key={result.id || index} className={styles.resultItem} tokens={{ childrenGap: 8 }} styles={{ root: { width: "100%" } }}>
                        {result.sourcefile && (
                            <Text variant="mediumPlus" className={styles.resultTitle}>
                                {result.sourcefile ? (
                                    <Link href={result.sourcefile} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                                        {result.sourcefile}
                                    </Link>
                                ) : (
                                    result.sourcefile
                                )}
                            </Text>
                        )}

                        <div className={styles.resultText}>
                            <ReactMarkdown children={result.content} rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} />
                        </div>
                        <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                            {!result.sourcefile && (
                                <Link href={result.sourcefile} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                                    {new URL(result.sourcefile).hostname}
                                </Link>
                            )}
                        </Stack>
                    </Stack>
                ))}
            </Stack>
        </div>
    );
    */
    return (
        <div className={styles.resultContainer}>
            {query && (
                <Text variant="large" block styles={{ root: { marginBottom: "1.5em" } }}>
                    Results for: <span className={styles.queryText}>{query}</span>
                </Text>
            )}
            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { width: "100%" } }}>
                {results.map((result, index) => (
                    <Stack key={result.id || index} className={styles.resultItem} tokens={{ childrenGap: 12 }} styles={{ root: { width: "100%" } }}>
                        <Stack tokens={{ childrenGap: 4 }}>
                            <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { width: "100%" } }}>
                                <Stack.Item>
                                    {result.sourcefile && result.storageUrl && (
                                        <Text variant="large" className={styles.resultTitle}>
                                            <Link href={result.storageUrl} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                                                {result.sourcefile.split("/").pop()?.split(".")[0] || "Document"}
                                            </Link>
                                        </Text>
                                    )}
                                </Stack.Item>
                                <Stack.Item>
                                    <Text variant="medium" className={styles.fileExtension}>
                                        {result.sourcefile?.split(".").pop()?.toUpperCase()}
                                    </Text>
                                </Stack.Item>
                            </Stack>

                            {result.sourcepage && result.sourcepage.includes("#page=") && (
                                <Text variant="medium" className={styles.sourcePage}>
                                    Page: {result.sourcepage.split("#page=")[1]}
                                </Text>
                            )}

                            {result.category && (
                                <div className={styles.categoryTag}>
                                    <Text variant="small">{result.category}</Text>
                                </div>
                            )}
                        </Stack>

                        <div className={styles.resultText}>
                            <ReactMarkdown children={result.content} rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]} />
                        </div>
                    </Stack>
                ))}
            </Stack>
        </div>
    );
};
