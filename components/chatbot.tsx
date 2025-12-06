"use client"

import { useState, useEffect, useRef } from "react"
import {
    MessageCircle, X, Bot, Sparkles, HelpCircle, ArrowLeft,
    Search, ThumbsUp, ThumbsDown, Minus, RefreshCw, Volume2, VolumeX
} from "lucide-react"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

interface Message {
    id: string
    text: string
    sender: "bot" | "user"
    timestamp: Date
    isThinking?: boolean
}

interface QAItem {
    question: string
    answer: string
    category?: string
    keywords?: string[]
}

const QA_DATABASE: QAItem[] = [
    // How It Works
    {
        question: "How does MixSafe work?",
        answer: "MixSafe uses **advanced OCR technology** to read medicine names from photos, then cross-references them with **three authoritative medical databases** (FDA, RxNorm & NIH) to detect potential drug interactions. You can also enter medicine names manually or use **voice input**!",
        category: "How It Works",
        keywords: ["work", "technology", "ocr", "fda", "nih"]
    },
    {
        question: "What databases do you use?",
        answer: "We use **3 authoritative sources**:\\n• **FDA OpenFDA** - Drug labels and warnings\\n• **NIH Drug Interaction API** - Verified interactions\\n• **RxNorm** - Drug name normalization\\n\\nThis ensures comprehensive and accurate results!",
        category: "How It Works",
        keywords: ["database", "fda", "nih", "rxnorm", "source"]
    },
    {
        question: "How accurate is the detection?",
        answer: "Our OCR has **high accuracy** for clear images. We use **official FDA + NIH databases** for interaction data. Our advanced risk scoring considers **6 different factors** for accurate assessment!",
        category: "How It Works",
        keywords: ["accuracy", "reliable", "trust"]
    },
    // Using the App
    {
        question: "How does voice input work?",
        answer: "Click the **microphone button** and speak your medicine names clearly. We use **Whisper AI** for accurate speech-to-text conversion that works **offline**! Just say medicine names separated by 'and' or 'comma'.",
        category: "Using the App",
        keywords: ["voice", "microphone", "speak", "audio", "whisper"]
    },
    {
        question: "Can I check multiple medicines at once?",
        answer: "**Yes!** You can upload a photo with multiple medicines or enter several medicine names separated by commas. We'll check all possible interactions between them.",
        category: "Using the App",
        keywords: ["multiple", "many", "several"]
    },
    {
        question: "Can the app read results to me?",
        answer: "**Yes!** Look for the **speaker icon** next to results. Click it to have the results read aloud to you. This is great for accessibility!",
        category: "Using the App",
        keywords: ["read", "speak", "audio", "tts", "accessibility"]
    },
    {
        question: "Can I download the results?",
        answer: "**Yes!** Click the 'Download Report' button to get a professional PDF report with all the interaction details, risk scores, and recommendations.",
        category: "Using the App",
        keywords: ["download", "pdf", "report", "save"]
    },
    // Understanding Results
    {
        question: "What do the risk scores mean?",
        answer: "Our **Advanced Risk Assessment** scores range from 0-100:\\n• **0-19: SAFE** - No significant interactions\\n• **20-54: CAUTION** - Monitor for side effects\\n• **55-100: DANGER** - Serious risk, consult doctor immediately",
        category: "Understanding Results",
        keywords: ["score", "risk", "safe", "danger", "caution"]
    },
    {
        question: "What is the Score Breakdown?",
        answer: "The Score Breakdown shows **how your risk score was calculated**:\\n• **Interactions** - Points from detected interactions\\n• **Polypharmacy** - Risk from taking many medications\\n• **Drug Class** - Risk from high-risk drug types\\n• **Multiplier** - Cumulative risk amplification",
        category: "Understanding Results",
        keywords: ["breakdown", "calculate", "factors", "polypharmacy"]
    },
    {
        question: "What are severity levels?",
        answer: "Interactions are rated as:\\n• **HIGH**: Contraindicated, life-threatening, or severe\\n• **MODERATE**: May require dose adjustment or monitoring\\n• **LOW**: Minor interactions, usually manageable",
        category: "Understanding Results",
        keywords: ["severity", "high", "moderate", "low", "level"]
    },
    // Safety & Privacy
    {
        question: "Is my data safe and private?",
        answer: "**Absolutely!** We process images in real-time and **don't store your personal health information**. Your privacy is our priority.",
        category: "Safety & Privacy",
        keywords: ["privacy", "safe", "data", "store"]
    },
    {
        question: "Should I stop taking my medicines?",
        answer: "**NO!** Never stop or change your medications without consulting your healthcare provider. Use MixSafe as an informational tool to have informed discussions with your doctor.",
        category: "Safety & Privacy",
        keywords: ["stop", "change", "medication"]
    },
    // Technical
    {
        question: "Which medicines are supported?",
        answer: "We support medicines in the **FDA database** plus many **Indian brands** (like Dolo, Crocin, Combiflam, Augmentin, etc.). Both generic and brand names work!",
        category: "Technical",
        keywords: ["supported", "brands", "indian", "generic"]
    },
    {
        question: "Does the app work offline?",
        answer: "**Partially!** Voice input uses **offline Whisper AI** for speech recognition. However, interaction checking requires internet access to query FDA/NIH databases.",
        category: "Technical",
        keywords: ["offline", "internet", "connection"]
    },
]

const CATEGORIES = ["How It Works", "Using the App", "Understanding Results", "Safety & Privacy", "Technical"]

interface ChatbotProps {
    context?: any
}

export function Chatbot({ context }: ChatbotProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [currentView, setCurrentView] = useState<"categories" | "questions" | "chat">("categories")
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isTyping, setIsTyping] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<QAItem[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { speak, cancel, isSpeaking } = useTextToSpeech({ rate: 1.1, pitch: 1.0 })
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen, isTyping])

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initial greeting
            let greetingText = "👋 Hi! I'm your **MixSafe AI Assistant**.\n\nI can help you understand drug interactions, explain how to use the app, or answer safety questions."

            if (context) {
                greetingText += "\n\nI see you have an analysis result. **Ask me about your results!**"
            } else {
                greetingText += "\n\n**How can I help you today?**"
            }

            const greeting: Message = {
                id: "1",
                text: greetingText,
                sender: "bot",
                timestamp: new Date(),
            }
            setMessages([greeting])
        }
    }, [isOpen, context])

    // Search Logic
    useEffect(() => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const results = QA_DATABASE.filter(qa =>
                qa.question.toLowerCase().includes(query) ||
                qa.keywords?.some(k => k.includes(query))
            )
            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }, [searchQuery])

    // Dynamic Categories
    const currentCategories = context
        ? ["About Your Results", ...CATEGORIES]
        : CATEGORIES

    // Dynamic Questions for Results
    const getQuestions = () => {
        if (selectedCategory === "About Your Results" && context) {
            const resultQuestions: QAItem[] = [
                {
                    question: "Summarize my results",
                    answer: `Based on your analysis, the safety status is **${context.status.toUpperCase()}** with a risk score of **${context.score}/100**.\n\nWe found **${context.interactions.length} interactions** among your medicines (${context.medicines.join(", ")}).`,
                    category: "About Your Results"
                },
                {
                    question: "Are there any severe interactions?",
                    answer: context.interactions.some((i: any) => i.severity === "high")
                        ? "**YES, HIGH SEVERITY INTERACTIONS DETECTED.**\n\nPlease consult your doctor immediately. Some medicines in your list have known severe interactions."
                        : "No high severity interactions were found, but always monitor for side effects.",
                    category: "About Your Results"
                },
                {
                    question: "What should I do next?",
                    answer: "1. **Review the detailed report** above.\n2. **Download the PDF** for your records.\n3. **Consult a healthcare provider** if you have any concerns, especially if the status is Caution or Danger.",
                    category: "About Your Results"
                }
            ]
            return resultQuestions
        }
        return selectedCategory
            ? QA_DATABASE.filter(qa => qa.category === selectedCategory)
            : QA_DATABASE
    }

    const filteredQuestions = getQuestions()

    const handleQuestionClick = (qa: QAItem) => {
        // Add user question
        const userMsg: Message = {
            id: Date.now().toString(),
            text: qa.question,
            sender: "user",
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMsg])
        setCurrentView("chat")
        setSearchQuery("") // Clear search
        setIsTyping(true)

        // Simulate thinking and typing
        setTimeout(() => {
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: qa.answer,
                sender: "bot",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, botMsg])
            setIsTyping(false)
        }, 1500)
    }

    const handleCategoryClick = (category: string) => {
        setSelectedCategory(category)
        setCurrentView("questions")
    }

    const handleBack = () => {
        if (currentView === "questions") {
            setCurrentView("categories")
            setSelectedCategory(null)
        } else if (currentView === "chat") {
            setCurrentView("categories")
        }
    }

    const handleReset = () => {
        setMessages([])
        setCurrentView("categories")
        // Re-trigger greeting
        setTimeout(() => {
            const greeting: Message = {
                id: Date.now().toString(),
                text: "👋 Hi! I'm your **MixSafe AI Assistant**.\n\nI can help you understand drug interactions, explain how to use the app, or answer safety questions. \n\n**How can I help you today?**",
                sender: "bot",
                timestamp: new Date(),
            }
            setMessages([greeting])
        }, 100)
    }

    const renderTextWithMarkdown = (text: string) => {
        // Simple markdown parser for bold text (**text**)
        const parts = text.split(/(\*\*.*?\*\*)/g)
        return parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={index} className="font-bold text-indigo-600 dark:text-indigo-400">{part.slice(2, -2)}</strong>
            }
            return part
        })
    }

    return (
        <>
            {/* Toggle Button with Advanced Bubble Effect */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    setIsMinimized(false)
                }}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 group ${isOpen && !isMinimized
                    ? "bg-slate-800 text-white rotate-90 scale-90"
                    : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white"
                    }`}
            >
                {/* Bubble effect */}
                {!isOpen && (
                    <>
                        <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-75 duration-1000" />
                        <div className="absolute inset-0 rounded-full bg-purple-400 animate-pulse opacity-50 duration-2000" />
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-bounce" />
                    </>
                )}
                <div className="relative z-10">
                    {isOpen && !isMinimized ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </div>
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-24 right-6 z-50 w-[90vw] md:w-96 max-h-[80vh] flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden transition-all duration-500 origin-bottom-right ${isOpen && !isMinimized
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 translate-y-10 pointer-events-none"
                    }`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 relative overflow-hidden">
                    {/* Animated Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_60%)] animate-spin-slow" />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            {(currentView === "questions" || currentView === "chat") && (
                                <button
                                    onClick={handleBack}
                                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 text-white" />
                                </button>
                            )}
                            <div className="relative">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-indigo-600 rounded-full animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg leading-tight">MixSafe AI</h3>
                                <p className="text-indigo-100 text-xs flex items-center gap-1 opacity-90">
                                    <Sparkles className="w-3 h-3" />
                                    Online & Ready
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMinimized(true)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 h-[450px]">

                    {/* Categories View */}
                    {currentView === "categories" && (
                        <div className="p-4 space-y-4">
                            {/* Search Bar */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 shadow-sm">
                                    <Search className="w-5 h-5 text-slate-400 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search for help..."
                                        className="w-full bg-transparent border-none outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchQuery ? (
                                <div className="space-y-2 animate-fade-in">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Results</h4>
                                    {searchResults.length > 0 ? (
                                        searchResults.map((qa, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuestionClick(qa)}
                                                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 text-left group"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                                        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm">{qa.question}</p>
                                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{qa.answer.replace(/\*\*/g, '')}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <p>No results found for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="text-center py-2">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                                            <Sparkles className="w-4 h-4 text-amber-500" />
                                            How can we help?
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {currentCategories.map((category, idx) => (
                                            <button
                                                key={category}
                                                onClick={() => handleCategoryClick(category)}
                                                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-left group relative overflow-hidden"
                                                style={{ animationDelay: `${idx * 0.1}s` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div>
                                                        <h5 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            {category}
                                                        </h5>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {category === "About Your Results"
                                                                ? "Analysis & recommendations"
                                                                : `${QA_DATABASE.filter(qa => qa.category === category).length} questions`
                                                            }
                                                        </p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                                        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 rotate-180 transition-all" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Questions View */}
                    {currentView === "questions" && (
                        <div className="p-4 space-y-3 animate-slide-in-right">
                            <div className="mb-4 text-center">
                                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {selectedCategory}
                                </span>
                            </div>
                            {filteredQuestions.map((qa, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuestionClick(qa)}
                                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all duration-200 text-left group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-indigo-600 transition-colors" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {qa.question}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Chat View */}
                    {currentView === "chat" && (
                        <div className="p-4 space-y-6">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-slide-up`}
                                >
                                    <div className={`flex gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === "user"
                                            ? "bg-indigo-100 dark:bg-indigo-900/50"
                                            : "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg"
                                            }`}>
                                            {msg.sender === "user" ? (
                                                <div className="w-4 h-4 bg-indigo-600 rounded-full" />
                                            ) : (
                                                <Bot className="w-5 h-5 text-white" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                                                ? "bg-indigo-600 text-white rounded-tr-none"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"
                                                }`}
                                        >
                                            <div className="whitespace-pre-line">
                                                {renderTextWithMarkdown(msg.text)}
                                            </div>

                                            {/* Feedback and TTS for bot messages */}
                                            {msg.sender === "bot" && (
                                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        {msg.id !== "1" && (
                                                            <>
                                                                <span className="text-[10px] text-slate-400">Helpful?</span>
                                                                <div className="flex gap-2">
                                                                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-green-500">
                                                                        <ThumbsUp className="w-3 h-3" />
                                                                    </button>
                                                                    <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-red-500">
                                                                        <ThumbsDown className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (speakingMessageId === msg.id) {
                                                                cancel()
                                                                setSpeakingMessageId(null)
                                                            } else {
                                                                cancel()
                                                                const cleanText = msg.text.replace(/\*\*/g, '').replace(/\n/g, '. ')
                                                                speak(cleanText)
                                                                setSpeakingMessageId(msg.id)
                                                                setTimeout(() => setSpeakingMessageId(null), cleanText.length * 50)
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                        title={speakingMessageId === msg.id ? "Stop speaking" : "Read aloud"}
                                                    >
                                                        {speakingMessageId === msg.id ? (
                                                            <VolumeX className="w-4 h-4 animate-pulse" />
                                                        ) : (
                                                            <Volume2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <div className="flex justify-start animate-fade-in">
                                    <div className="flex gap-2 max-w-[85%]">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700">
                    {currentView === "chat" ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentView("categories")}
                                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all duration-300"
                                title="Restart Chat"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-[10px] text-slate-400">
                                AI responses are for informational purposes only.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
