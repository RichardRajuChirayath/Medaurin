"use client"

import { useState, useEffect, useRef } from "react"
import {
    MessageCircle, X, Bot, Sparkles, HelpCircle, ArrowLeft,
    Search, ThumbsUp, ThumbsDown, Minus, RefreshCw
} from "lucide-react"

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
    // Core Features
    {
        question: "What is Medaurin?",
        answer: "Medaurin is India's **most advanced medicine safety platform** that combines **Drug Interaction Checker** and **Medicine Expense Tracker** - all in one app! \\n\\n✓ Check drug interactions\\n✓ Track medicine expenses\\n✓ 100% FREE",
        category: "Core Features",
        keywords: ["mixsafe", "what", "about", "features"]
    },
    {
        question: "What makes Medaurin unique?",
        answer: "Medaurin is the **ONLY app in India** that offers:\\n\\n💰 **Expense Tracking** - OCR, Email import, OpenStreetMap pharmacies\\n⚕️ **Drug Interaction** - AI-powered safety checker\\n🔔 **Smart Alerts** - FCM notifications\\n\\n**100% Offline datasets. 100% Free. 100% Safe.**",
        category: "Core Features",
        keywords: ["unique", "special", "different", "why"]
    },

    // Drug Interaction Checker
    {
        question: "How does drug interaction checking work?",
        answer: "Our **AI-powered system** analyzes your medicines using:\\n\\n• **3 Medical Databases** - FDA, NIH, RxNorm\\n• **Advanced OCR** - Read medicine names from photos\\n• **6-Factor Risk Scoring** - Comprehensive safety assessment \\n\\nGet results in seconds with detailed analysis!",
        category: "Drug Interaction",
        keywords: ["work", "interaction", "check", "safety"]
    },
    {
        question: "What databases do you use for interactions?",
        answer: "We use **3 authoritative medical databases**:\\n\\n• **FDA OpenFDA** - Official drug labels & warnings\\n• **NIH Drug Interaction API** - Verified medical data\\n• **RxNorm** - Drug name normalization\\n\\nThis triple-validation ensures **maximum accuracy** and reliability!",
        category: "Drug Interaction",
        keywords: ["database", "fda", "nih", "rxnorm", "source", "accuracy"]
    },
    {
        question: "Can I upload medicine photos?",
        answer: "**YES!** Our **advanced OCR technology** can read medicine names from:\\n\\n📸 Medicine strips/packets\\n📄 Prescription slips\\n🏥 Hospital bills\\n\\nJust snap a clear photo and we'll extract all medicine names automatically!",
        category: "Drug Interaction",
        keywords: ["photo", "ocr", "image", "scan", "upload"]
    },


    // Medicine Expense Tracker
    {
        question: "What is the Medicine Expense Tracker?",
        answer: "A **comprehensive expense management system** for your medicines:\\n\\n💊 **Track all medicine purchases**\\n📊 **Monthly insights & analytics**\\n🧾 **OCR bill scanning** (auto-extract from photos)\\n📧 **Email invoice import** (IMAP integration)\\n🗺️ **Pharmacy finder** (OpenStreetMap)\\n📥 **Export data** (Excel/CSV)\\n🔔 **Budget alerts** (FCM notifications)",
        category: "Expense Tracker",
        keywords: ["expense", "tracker", "bill", "cost", "money", "spending"]
    },
    {
        question: "How does OCR bill scanning work?",
        answer: "Upload a photo of your medicine bill and we'll **automatically extract**:\\n\\n• **Medicine name**\\n• **Price**\\n• **Quantity**\\n• **Pharmacy name**\\n• **Purchase date**\\n\\nUses **Tesseract.js** - 100% browser-based, no data sent to servers! Just upload and save!",
        category: "Expense Tracker",
        keywords: ["ocr", "bill", "scan", "receipt", "upload", "photo"]
    },
    {
        question: "Can I import from email invoices?",
        answer: "**YES!** Set up **IMAP email import** to automatically fetch pharmacy invoices:\\n\\n✓ Gmail, Outlook, Yahoo supported\\n✓ Use **app-specific passwords** (not your real password)\\n✓ **AES-256 encryption** for security\\n✓ Auto-parses email invoices\\n\\nYour email credentials are **never stored in plain text**!",
        category: "Expense Tracker",
        keywords: ["email", "imap", "import", "invoice", "automatic"]
    },
    {
        question: "What is the Pharmacy & Doctor Finder?",
        answer: "Find **nearby pharmacies, clinics, and hospitals**:\\n\\n🗺️ **OpenStreetMap integration** - Locate medical facilities nearby\\n👨‍⚕️ **Doctor Finder** - Find nearby doctors & clinics\\n💰 **Spending insights** - Track expenses per location\\n📍 **Navigation** - Open in Google Maps\\n\\n**100% offline maps support.**",
        category: "Expense Tracker",
        keywords: ["pharmacy", "doctor", "clinic", "hospital", "map", "location", "nearby"]
    },
    {
        question: "How do budget alerts work?",
        answer: "Set a **monthly medicine budget** and get **FCM push notifications**:\\n\\n⚠️ **80% spent** - Warning alert\\n🔴 **100% spent** - Budget exceeded alert\\n\\nNotifications work even when app is closed. Stay in control of your spending!",
        category: "Expense Tracker",
        keywords: ["budget", "alert", "notification", "fcm", "push"]
    },
    {
        question: "What is the Weather Health Shield?",
        answer: "A **world-first safety feature** that monitors environmental conditions 24/7:\\n\\n☀️ **UV Alerts** - If your medicine causes sun sensitivity (e.g., Doxycycline)\\n🌡️ **Heat Warnings** - Dehydration risks for diuretics, insulin storage\\n❄️ **Cold Alerts** - Asthma inhaler effectiveness, insulin freezing\\n💧 **Humidity Monitoring** - Medicine storage degradation\\n🏭 **Air Quality** - Asthma trigger warnings\\n\\n**100% FREE weather data. Saves lives daily.**",
        category: "Expense Tracker",
        keywords: ["weather", "health", "shield", "uv", "heat", "cold", "air quality", "environment", "safety", "alert"]
    },



    // Analytics & Insights
    {
        question: "What analytics do I get?",
        answer: "**Comprehensive monthly insights**:\\n\\n📊 **Pie Chart** - Category-wise spending breakdown\\n📈 **Bar Chart** - Top 5 pharmacies by spending\\n💊 **Top Medicines** - Most expensive purchases\\n📉 **Month Comparison** - Spending trends with % change\\n\\nAll visualized with **beautiful charts** powered by Recharts!",
        category: "Analytics",
        keywords: ["analytics", "insights", "chart", "graph", "report", "statistics"]
    },
    {
        question: "Can I export my expense data?",
        answer: "**YES!** Export in **3 formats**:\\n\\n📊 **Excel (.xlsx)** - Full spreadsheet with all fields\\n📋 **CSV** - Import into other apps\\n\\nOne-click download. All data included. Perfect for tax/reimbursement!",
        category: "Analytics",
        keywords: ["export", "download", "pdf", "excel", "csv", "report"]
    },

    // Security & Privacy
    {
        question: "Is my data safe?",
        answer: "**Absolutely!** We implement **military-grade security**:\\n\\n🔐 **AES-256 encryption** for email passwords\\n🛡️ **User-scoped queries** - See only your data\\n🔒 **Session-based auth** - Secure login system\\n❌ **No data selling** - Your privacy is sacred\\n📱 **GDPR compliant** - Respect your rights\\n\\nYour health  and financial data **never leaves your control**.",
        category: "Security",
        keywords: ["security", "privacy", "safe", "encryption", "data", "gdpr"]
    },
    {
        question: "How are app passwords encrypted?",
        answer: "**AES-256 GCM encryption** - Same as banks & military:\\n\\n• Email passwords **never stored in plain text**\\n• Uses **32-character encryption key**\\n• Decrypted **only in memory** when needed\\n• Impossible to reverse-engineer\\n\\n**We can't see your passwords. Nobody can.** ✓",
        category: "Security",
        keywords: ["password", "encryption", "aes", "secure", "email"]
    },

    // Technical
    {
        question: "What technologies power Medaurin?",
        answer: "**Modern, robust tech stack**:\\n\\n⚛️ **Next.js 15** - React framework\\n🎨 **TypeScript** - Type-safe code\\n🗄️ **PostgreSQL + Prisma** - Scalable database\\n🔔 **Firebase Cloud Messaging** - Push notifications\\n🗺️ **OpenStreetMap** - Free mapping\\n📸 **Tesseract.js** - Browser OCR\\n📊 **Recharts** - Data visualization\\n\\n**100% free tools. 100% open architecture.**",
        category: "Technical",
        keywords: ["technology", "stack", "framework", "built", "how"]
    },
    {
        question: "Does Medaurin work offline?",
        answer: "**Partially!** \\n\\n✅ **Offline**:\\n- India govt verification (local datasets)\\n- Expense tracker (local storage)\\n\\n❌ **Needs Internet**:\\n- Drug interaction API (FDA/NIH)\\n- Email import (IMAP)\\n- FCM notifications\\n\\nCore features work **without constant internet**!",
        category: "Technical",
        keywords: ["offline", "internet", "connection", "network"]
    },
    {
        question: "Is Medaurin free?",
        answer: "**100% FREE. Forever.**\\n\\n✅ No subscriptions\\n✅ No in-app purchases\\n✅ No ads\\n✅ No hidden costs\\n✅ No API charges\\n\\n**Why free?** We use only free/open-source tools:\\n- Free FDA/NIH APIs\\n- Free OpenStreetMap\\n- Free Firebase (within limits)\\n- Self-hosted backend\\n\\n**Our mission**: Make healthcare transparent & accessible to ALL Indians! 🇮🇳",
        category: "Technical",
        keywords: ["free", "cost", "price", "subscription", "paid"]
    },

    // Safety Guidelines
    {
        question: "Should I stop taking my medicines?",
        answer: "**NO! NEVER STOP MEDICATIONS WITHOUT CONSULTING YOUR DOCTOR!**\\n\\nMedaurin is an **informational tool** to help you:\\n✓ Have informed discussions with doctors\\n✓ Understand potential risks\\n✓ Track your spending\\n\\n**We do NOT provide medical advice.** Always consult healthcare professionals for medical decisions.",
        category: "Safety Guidelines",
        keywords: ["stop", "change", "medication", "doctor", "medical advice"]
    },
    {
        question: "Is Medaurin Play Store approved?",
        answer: "**YES!** Medaurin follows **all Play Store guidelines**:\\n\\n✅ **No medical advice** - Only informational\\n✅ **Disclaimers** shown clearly\\n✅ **Data privacy** compliant\\n✅ **FDA/Govt data** for reference only\\n✅ **User consent** for all features\\n\\nWe **DO NOT** diagnose, treat, or recommend stopping medications.",
        category: "Safety Guidelines",
        keywords: ["playstore", "google play", "approved", "compliant", "guidelines"]
    },

    // Caregiver & Family
    {
        question: "What is Caregiver Live-Link?",
        answer: "A real-time safety dashboard for families! Link your account with a caregiver (family member/doctor) to:\\n\\n👁️ Share your medication status live\\n⚠️ Send instant alerts for missed doses\\n❤️ Let them monitor your health remotely\\n\\nTotally secure and requires your approval.",
        category: "Caregiver & Family",
        keywords: ["caregiver", "family", "link", "share", "monitor", "dashboard"]
    },

    // Safety Features (New)
    {
        question: "How does the Health Profile Shield work?",
        answer: "We personalize safety checks using your **health profile**:\\n\\n🚫 **Allergy Guard**: Warns if a medicine matches your allergies\\n⚠️ **Condition Check**: Cross-references 200+ diseases (e.g., Asthma, Hypertension) using **Official NIH Data**\\n\\nAdd your details in Profile -> Health to activate!",
        category: "Safety Features",
        keywords: ["shield", "health", "profile", "allergy", "condition", "asthma", "diabetes"]
    },
    {
        question: "What is Double Dosing Prevention?",
        answer: "Accidentally taking medicine twice is dangerous. Medaurin remembers what you took!\\n\\nIf you scan 'Paracetamol' at 9 AM and again at 11 AM, we show a **CRITICAL WARNING**: 'Already Taken'.\\n\\nKeeps you safe from accidental overdoses.",
        category: "Safety Features",
        keywords: ["double", "dosing", "twice", "overdose", "repeat", "taken"]
    }
]

const CATEGORIES = [
    "Core Features",
    "Drug Interaction",
    "Expense Tracker",
    "Safety Features",
    "Caregiver & Family",
    "Analytics",
    "Security",
    "Technical",
    "Safety Guidelines"
]

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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen, isTyping])

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            let greetingText = "👋 **Welcome to Medaurin Assistant!**\\n\\nI'm here to help you with:\\n\\n💊 Drug Interactions\\n💰 Expense Tracking\\n📊 Analytics & Checking"

            if (context) {
                greetingText += "\\n\\n**I see your analysis results. Ask me anything!**"
            } else {
                greetingText += "\\n\\n**What would you like to know?**"
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
                qa.answer.toLowerCase().includes(query) ||
                qa.keywords?.some(k => k.includes(query))
            )
            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }, [searchQuery])

    // External Trigger Logic
    useEffect(() => {
        const handleOpenChat = () => {
            setIsOpen(true)
            setIsMinimized(false)
        }
        window.addEventListener('open-medaurin-chat', handleOpenChat)
        return () => window.removeEventListener('open-medaurin-chat', handleOpenChat)
    }, [])

    const currentCategories = context
        ? ["About Your Results", ...CATEGORIES]
        : CATEGORIES

    const getQuestions = () => {
        if (selectedCategory === "About Your Results" && context) {
            const resultQuestions: QAItem[] = [
                {
                    question: "Summarize my results",
                    answer: `Your analysis shows **${context.status.toUpperCase()}** status with a risk score of **${context.score}/100**.\\n\\nFound **${context.interactions.length} interactions** among: ${context.medicines.join(", ")}`,
                    category: "About Your Results"
                },
                {
                    question: "Are there severe interactions?",
                    answer: context.interactions.some((i: any) => i.severity === "high")
                        ? "**YES - HIGH SEVERITY DETECTED!**\\n\\nPlease consult your doctor immediately. Some medicines have known severe interactions."
                        : "No high severity interactions found. Still monitor for side effects.",
                    category: "About Your Results"
                },
                {
                    question: "What should I do next?",
                    answer: "**Recommended Actions:**\\n\\n1. Review detailed results above\\n2. Consult healthcare provider if Caution/Danger status\\n3. Track expenses in Expense Tracker tab",
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
        const userMsg: Message = {
            id: Date.now().toString(),
            text: qa.question,
            sender: "user",
            timestamp: new Date(),
        }
        setMessages((prev) => [...prev, userMsg])
        setCurrentView("chat")
        setSearchQuery("")
        setIsTyping(true)

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
        setTimeout(() => {
            const greeting: Message = {
                id: Date.now().toString(),
                text: "👋 **Welcome back to Medaurin!**\\n\\nReady to help with drug interactions, expense tracking, or India govt verification. \\n\\n**How can I assist you?**",
                sender: "bot",
                timestamp: new Date(),
            }
            setMessages([greeting])
        }, 100)
    }

    const renderTextWithMarkdown = (text: string) => {
        // First replace literal \n with actual newlines
        const textWithBreaks = text.replace(/\\n/g, '\n')

        // Split by both markdown and newlines
        const lines = textWithBreaks.split('\n')

        return lines.map((line, lineIndex) => {
            const parts = line.split(/(\*\*.*?\*\*)/g)
            const renderedLine = parts.map((part, partIndex) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={`${lineIndex}-${partIndex}`} className="font-bold text-indigo-600 dark:text-indigo-400">{part.slice(2, -2)}</strong>
                }
                return part
            })

            // Add line break after each line except the last
            if (lineIndex < lines.length - 1) {
                return (
                    <span key={lineIndex}>
                        {renderedLine}
                        <br />
                    </span>
                )
            }
            return <span key={lineIndex}>{renderedLine}</span>
        })
    }

    return (
        <>
            {/* Toggle Button - Hidden on mobile, handled by MobileNav */}
            <button
                onClick={() => {
                    setIsOpen(!isOpen)
                    setIsMinimized(false)
                }}
                className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 group hidden md:flex ${isOpen && !isMinimized
                    ? "bg-slate-800 text-white rotate-90 scale-90"
                    : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white"
                    }`}
            >
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
                                <h3 className="font-extrabold text-white text-xl leading-tight drop-shadow-lg tracking-wide">Medaurin</h3>
                                <p className="text-indigo-100 text-xs flex items-center gap-1 opacity-95 font-semibold">
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

                                        <div
                                            className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === "user"
                                                ? "bg-indigo-600 text-white rounded-tr-none"
                                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none"
                                                }`}
                                        >
                                            <div className="whitespace-pre-line">
                                                {renderTextWithMarkdown(msg.text)}
                                            </div>

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

                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

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

                {/* Footer */}
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
                                AI responses are informational only. Consult healthcare providers for medical advice.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
