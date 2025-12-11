import { useMsal } from "@azure/msal-react";
import { Pivot, PivotItem } from "@fluentui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ChatAppResponse, getHeaders } from "../../api";
import { getToken, useLogin } from "../../authConfig";
import { MarkdownViewer } from "../MarkdownViewer";
import { SupportingContent } from "../SupportingContent";
import styles from "./DocumentViewer.module.css";

interface Props {
    className: string;
    activeDocument: string | undefined;
    documentHeight: string;
    onDocumentClicked?: (documentFilePath: string) => void;
}

const pivotItemDisabledStyle = { disabled: true, style: { color: "grey" } };

export const DocumentViewer = ({ activeDocument, documentHeight, className, onDocumentClicked }: Props) => {
    const isDisabledDocumentTab: boolean = !activeDocument;
    const [document, setDocument] = useState("");

    const client = useLogin ? useMsal().instance : undefined;
    const { t } = useTranslation();

    const fetchDocument = async () => {
        const token = client ? await getToken(client) : undefined;
        if (activeDocument) {
            // Get hash from the URL as it may contain #page=N
            // which helps browser PDF renderer jump to correct page N
            const originalHash = activeDocument.indexOf("#") ? activeDocument.split("#")[1] : "";
            const response = await fetch(activeDocument, {
                method: "GET",
                headers: await getHeaders(token)
            });
            const documentContent = await response.blob();
            let documentObjectUrl = URL.createObjectURL(documentContent);
            // Add hash back to the new blob URL
            if (originalHash) {
                documentObjectUrl += "#" + originalHash;
            }
            setDocument(documentObjectUrl);
        }
    };
    useEffect(() => {
        fetchDocument();
    }, []);

    const renderFileViewer = () => {
        if (!activeDocument) {
            return null;
        }

        const fileExtension = activeDocument.split(".").pop()?.toLowerCase();
        switch (fileExtension) {
            case "png":
                return <img src={document} className={styles.documentImg} alt="Document Image" />;
            case "md":
                return <MarkdownViewer src={activeDocument} />;
            default:
                return <iframe title="Document" src={document} width="100%" height={documentHeight} />;
        }
    };

    return (
        <Pivot className={`${styles.pivotContainer} ${className}`} selectedKey={"document"}>
            <PivotItem
                itemKey={"document"}
                headerText={"Document"}
                headerButtonProps={isDisabledDocumentTab ? pivotItemDisabledStyle : undefined}
                className={styles.pivotContent}
            >
                {renderFileViewer()}
            </PivotItem>
        </Pivot>
    );
};
