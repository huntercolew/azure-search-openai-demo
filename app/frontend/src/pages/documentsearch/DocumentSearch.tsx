import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Panel, DefaultButton, Spinner, Stack } from "@fluentui/react";
import { Image } from "@fluentui/react";
import { SearchResults } from "../../components/SearchResults/SearchResults";

import styles from "./DocumentSearch.module.css";

import { searchApi, configApi, ChatAppResponse, SearchRequest, RetrievalMode, SpeechConfig, DocumentSearchResponse, SearchDocument } from "../../api";
import { Answer, AnswerError } from "../../components/Answer";
import { QuestionInput } from "../../components/QuestionInput";
import { ExampleList } from "../../components/Example";
import { AnalysisPanel, AnalysisPanelTabs } from "../../components/AnalysisPanel";
import { SettingsButton } from "../../components/SettingsButton/SettingsButton";
import { useLogin, getToken, requireAccessControl } from "../../authConfig";
import { UploadFile } from "../../components/UploadFile";
import { Settings } from "../../components/Settings/Settings";
import { useMsal } from "@azure/msal-react";
import { TokenClaimsDisplay } from "../../components/TokenClaimsDisplay";
import { LoginContext } from "../../loginContext";
import { LanguagePicker } from "../../i18n/LanguagePicker";

import waveUrl from "../../assets/FS_LOGO_stylizedWave.png";

export function Component(): JSX.Element {
    const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
    const [promptTemplate, setPromptTemplate] = useState<string>("");
    const [promptTemplatePrefix, setPromptTemplatePrefix] = useState<string>("");
    const [promptTemplateSuffix, setPromptTemplateSuffix] = useState<string>("");
    const [temperature, setTemperature] = useState<number>(0.3);
    const [seed, setSeed] = useState<number | null>(null);
    const [minimumRerankerScore, setMinimumRerankerScore] = useState<number>(1.9);
    const [minimumSearchScore, setMinimumSearchScore] = useState<number>(0);
    const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(RetrievalMode.Hybrid);
    const [retrieveCount, setRetrieveCount] = useState<number>(3);
    const [agenticReasoningEffort, setRetrievalReasoningEffort] = useState<string>("minimal");
    const [useSemanticRanker, setUseSemanticRanker] = useState<boolean>(true);
    const [useSemanticCaptions, setUseSemanticCaptions] = useState<boolean>(false);
    const [useQueryRewriting, setUseQueryRewriting] = useState<boolean>(false);
    const [reasoningEffort, setReasoningEffort] = useState<string>("");
    const [sendTextSources, setSendTextSources] = useState<boolean>(true);
    const [sendImageSources, setSendImageSources] = useState<boolean>(false);
    const [includeCategory, setIncludeCategory] = useState<string>("");

    const [excludeCategory, setExcludeCategory] = useState<string>("");
    const [question, setQuestion] = useState<string>("");
    const [searchTextEmbeddings, setSearchTextEmbeddings] = useState<boolean>(true);
    const [searchImageEmbeddings, setSearchImageEmbeddings] = useState<boolean>(false);
    const [showMultimodalOptions, setShowMultimodalOptions] = useState<boolean>(false);
    const [showSemanticRankerOption, setShowSemanticRankerOption] = useState<boolean>(false);
    const [showQueryRewritingOption, setShowQueryRewritingOption] = useState<boolean>(false);
    const [showReasoningEffortOption, setShowReasoningEffortOption] = useState<boolean>(false);
    const [showVectorOption, setShowVectorOption] = useState<boolean>(false);
    const [showUserUpload, setShowUserUpload] = useState<boolean>(false);
    const [showLanguagePicker, setshowLanguagePicker] = useState<boolean>(false);
    const [showSpeechInput, setShowSpeechInput] = useState<boolean>(false);
    const [showSpeechOutputBrowser, setShowSpeechOutputBrowser] = useState<boolean>(false);
    const [showSpeechOutputAzure, setShowSpeechOutputAzure] = useState<boolean>(false);
    const audio = useRef(new Audio()).current;
    const [isPlaying, setIsPlaying] = useState(false);
    const [showAgenticRetrievalOption, setShowAgenticRetrievalOption] = useState<boolean>(false);
    const [webSourceSupported, setWebSourceSupported] = useState<boolean>(false);
    const [webSourceEnabled, setWebSourceEnabled] = useState<boolean>(false);
    const [sharePointSourceSupported, setSharePointSourceSupported] = useState<boolean>(false);
    const [sharePointSourceEnabled, setSharePointSourceEnabled] = useState<boolean>(false);
    const [useAgenticKnowledgeBase, setUseAgenticRetrieval] = useState<boolean>(false);
    const [hideMinimalRetrievalReasoningOption, setHideMinimalRetrievalReasoningOption] = useState<boolean>(false);

    //Search
    const lastQuestionRef = useRef<string>("");
    const [lastQuestion, setLastQuestion] = useState<string>("");
    const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
    const [answer, setAnswer] = useState<DocumentSearchResponse | undefined>();
    const [searchResults, setSearchResults] = useState<SearchDocument[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [searchQuery, setSearchQuery] = useState<string>("");

    // For the Ask tab, this array will hold a maximum of one URL
    const [speechUrls, setSpeechUrls] = useState<(string | null)[]>([]);

    const speechConfig: SpeechConfig = {
        speechUrls,
        setSpeechUrls,
        audio: useRef(new Audio()).current,
        isPlaying: useRef(false).current,
        setIsPlaying: setIsPlaying
    };

    const [activeCitation, setActiveCitation] = useState<string>();
    const [activeAnalysisPanelTab, setActiveAnalysisPanelTab] = useState<AnalysisPanelTabs | undefined>(undefined);
    const [selectedResult, setSelectedResult] = useState<SearchDocument | null>(null);

    const client = useLogin ? useMsal().instance : undefined;
    const { loggedIn } = useContext(LoginContext);

    const getConfig = async () => {
        configApi().then(config => {
            setShowMultimodalOptions(config.showMultimodalOptions);
            if (config.showMultimodalOptions) {
                // Initialize from server config so defaults follow deployment settings
                setSendTextSources(config.ragSendTextSources !== undefined ? config.ragSendTextSources : true);
                setSendImageSources(config.ragSendImageSources);
                setSearchTextEmbeddings(config.ragSearchTextEmbeddings);
                setSearchImageEmbeddings(config.ragSearchImageEmbeddings);
            }
            setUseSemanticRanker(config.showSemanticRankerOption);
            setShowSemanticRankerOption(config.showSemanticRankerOption);
            setUseQueryRewriting(config.showQueryRewritingOption);
            setShowQueryRewritingOption(config.showQueryRewritingOption);
            setShowReasoningEffortOption(config.showReasoningEffortOption);
            if (config.showReasoningEffortOption) {
                setReasoningEffort(config.defaultReasoningEffort);
            }
            setShowVectorOption(config.showVectorOption);
            if (!config.showVectorOption) {
                setRetrievalMode(RetrievalMode.Text);
            }
            setShowUserUpload(config.showUserUpload);
            setshowLanguagePicker(config.showLanguagePicker);
            setShowSpeechInput(config.showSpeechInput);
            setShowSpeechOutputBrowser(config.showSpeechOutputBrowser);
            setShowSpeechOutputAzure(config.showSpeechOutputAzure);
            setShowAgenticRetrievalOption(config.showAgenticRetrievalOption);
            setUseAgenticRetrieval(config.showAgenticRetrievalOption);
            setWebSourceSupported(config.webSourceEnabled);
            setWebSourceEnabled(config.webSourceEnabled);
            setSharePointSourceSupported(config.sharepointSourceEnabled);
            setSharePointSourceEnabled(config.sharepointSourceEnabled);
            if (config.showAgenticRetrievalOption) {
                setRetrieveCount(10);
            }
            const defaultRetrievalEffort = config.defaultRetrievalReasoningEffort ?? "minimal";
            setHideMinimalRetrievalReasoningOption(config.webSourceEnabled);
            setRetrievalReasoningEffort(defaultRetrievalEffort);
        });
    };

    useEffect(() => {
        getConfig();
    }, []);

    const buildFilterString = (): string => {
        const filterParts: string[] = [];

        // Add include category filter if specified
        if (includeCategory) {
            filterParts.push(`category/any(c: search.in(c, '${includeCategory}', ','))`);
        }

        // Add exclude category filter if specified
        if (excludeCategory) {
            filterParts.push(`not category/any(c: search.in(c, '${excludeCategory}', ','))`);
        }

        // Add any additional filters from the filters state
        filters.forEach(filter => {
            filterParts.push(`${filter.key} eq '${filter.value.replace(/'/g, "''")}'`);
        });

        return filterParts.join(" and ") || "";
    };

    const makeApiRequest = async (query: string) => {
        lastQuestionRef.current = query;
        setSearchQuery(query);

        setError(undefined);
        setIsLoading(true);
        setSearchResults([]);
        setActiveCitation(undefined);
        setActiveAnalysisPanelTab(undefined);

        try {
            const token = client ? await getToken(client) : undefined;
            const request: SearchRequest = {
                query: query,
                top: retrieveCount,
                filter: buildFilterString(),
                queryType: useSemanticRanker ? "semantic" : "simple",
                queryLanguage: i18n.language,
                semanticConfiguration: "default"
            };

            const result = await searchApi(request, token);
            setSearchResults(result.results || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingsChange = (field: string, value: any) => {
        switch (field) {
            case "promptTemplate":
                setPromptTemplate(value);
                break;
            case "promptTemplatePrefix":
                setPromptTemplatePrefix(value);
                break;
            case "promptTemplateSuffix":
                setPromptTemplateSuffix(value);
                break;
            case "temperature":
                setTemperature(value);
                break;
            case "seed":
                setSeed(value);
                break;
            case "minimumRerankerScore":
                setMinimumRerankerScore(value);
                break;
            case "minimumSearchScore":
                setMinimumSearchScore(value);
                break;
            case "retrieveCount":
                setRetrieveCount(value);
                break;
            case "agenticReasoningEffort":
                setRetrievalReasoningEffort(value);
                if (value === "minimal" && webSourceEnabled) {
                    setWebSourceEnabled(false);
                    setHideMinimalRetrievalReasoningOption(false);
                }
                break;
            case "useSemanticRanker":
                setUseSemanticRanker(value);
                break;
            case "useSemanticCaptions":
                setUseSemanticCaptions(value);
                break;
            case "useQueryRewriting":
                setUseQueryRewriting(value);
                break;
            case "reasoningEffort":
                setReasoningEffort(value);
                break;
            case "excludeCategory":
                setExcludeCategory(value);
                break;
            case "includeCategory":
                setIncludeCategory(value);
                break;
            case "llmInputs":
                break;
            case "sendTextSources":
                setSendTextSources(value);
                break;
            case "sendImageSources":
                setSendImageSources(value);
                break;
            case "searchTextEmbeddings":
                setSearchTextEmbeddings(value);
                break;
            case "searchImageEmbeddings":
                setSearchImageEmbeddings(value);
                break;
            case "retrievalMode":
                setRetrievalMode(value);
                break;
            case "useAgenticKnowledgeBase":
                setUseAgenticRetrieval(value);
                break;
            case "useWebSource":
                if (!webSourceSupported) {
                    setWebSourceEnabled(false);
                    return;
                }
                setWebSourceEnabled(value);
                setHideMinimalRetrievalReasoningOption(value);
                break;
            case "useSharePointSource":
                if (!sharePointSourceSupported) {
                    setSharePointSourceEnabled(false);
                    return;
                }
                setSharePointSourceEnabled(value);
                break;
        }
    };

    const onExampleClicked = (example: string) => {
        makeApiRequest(example);
        setQuestion(example);
    };

    const onShowCitation = (citation: string) => {
        if (activeCitation === citation && activeAnalysisPanelTab === AnalysisPanelTabs.CitationTab) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveCitation(citation);
            setActiveAnalysisPanelTab(AnalysisPanelTabs.CitationTab);
        }
    };

    const onToggleTab = (tab: AnalysisPanelTabs) => {
        if (activeAnalysisPanelTab === tab) {
            setActiveAnalysisPanelTab(undefined);
        } else {
            setActiveAnalysisPanelTab(tab);
        }
    };

    const { t, i18n } = useTranslation();

    return (
        <div className={styles.documentSearchContainer}>
            <Helmet>
                <title>{t("pageTitle")}</title>
            </Helmet>
            <div className={styles.documentSearchTopSection}>
                <div className={styles.commandsContainer}>
                    {showUserUpload && <UploadFile className={styles.commandButton} disabled={!loggedIn} />}
                    <SettingsButton className={styles.commandButton} onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)} />
                </div>
                <h1 className={styles.documentSearchTitle}>{t("searchTitle")}</h1>
                <div className={styles.logoWrapper}>
                    <img src={waveUrl} alt="FedScale Wave" className={styles.waveLogo} />
                </div>
                <div className={styles.documentSearchInput}>
                    <QuestionInput
                        placeholder={t("searchPlaceholder")}
                        disabled={isLoading}
                        initQuestion={question}
                        onSend={question => makeApiRequest(question)}
                        showSpeechInput={showSpeechInput}
                    />
                </div>
            </div>
            <div className={styles.documentSearchBottomSection}>
                <div className={styles.documentSearchResults}>
                    <SearchResults results={searchResults} isLoading={isLoading} error={error} query={searchQuery} />
                </div>
            </div>

            <Panel
                headerText={t("labels.headerText")}
                isOpen={isConfigPanelOpen}
                isBlocking={false}
                onDismiss={() => setIsConfigPanelOpen(false)}
                closeButtonAriaLabel={t("labels.closeButton")}
                onRenderFooterContent={() => <DefaultButton onClick={() => setIsConfigPanelOpen(false)}>{t("labels.closeButton")}</DefaultButton>}
                isFooterAtBottom={true}
            >
                <Settings
                    promptTemplate={promptTemplate}
                    promptTemplatePrefix={promptTemplatePrefix}
                    promptTemplateSuffix={promptTemplateSuffix}
                    temperature={temperature}
                    retrieveCount={retrieveCount}
                    agenticReasoningEffort={agenticReasoningEffort}
                    seed={seed}
                    minimumSearchScore={minimumSearchScore}
                    minimumRerankerScore={minimumRerankerScore}
                    useSemanticRanker={useSemanticRanker}
                    useSemanticCaptions={useSemanticCaptions}
                    useQueryRewriting={useQueryRewriting}
                    reasoningEffort={reasoningEffort}
                    excludeCategory={excludeCategory}
                    includeCategory={includeCategory}
                    retrievalMode={retrievalMode}
                    sendTextSources={sendTextSources}
                    sendImageSources={sendImageSources}
                    searchTextEmbeddings={searchTextEmbeddings}
                    searchImageEmbeddings={searchImageEmbeddings}
                    showSemanticRankerOption={showSemanticRankerOption}
                    showQueryRewritingOption={showQueryRewritingOption}
                    showReasoningEffortOption={showReasoningEffortOption}
                    showMultimodalOptions={showMultimodalOptions}
                    showVectorOption={showVectorOption}
                    useLogin={!!useLogin}
                    loggedIn={loggedIn}
                    requireAccessControl={requireAccessControl}
                    showAgenticRetrievalOption={showAgenticRetrievalOption}
                    useAgenticKnowledgeBase={useAgenticKnowledgeBase}
                    useWebSource={webSourceEnabled}
                    showWebSourceOption={webSourceSupported}
                    useSharePointSource={sharePointSourceEnabled}
                    showSharePointSourceOption={sharePointSourceSupported}
                    hideMinimalRetrievalReasoningOption={hideMinimalRetrievalReasoningOption}
                    onChange={handleSettingsChange}
                />
                {useLogin && <TokenClaimsDisplay />}
            </Panel>
        </div>
    );
}

//Component.displayName = "Search";
