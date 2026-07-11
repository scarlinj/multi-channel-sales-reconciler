import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { 
  FileSpreadsheet, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Search, 
  Download, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Database,
  Filter,
  ArrowRight,
  TrendingUp as TrendIcon,
  HelpCircle,
  Copy,
  Info
} from "lucide-react";
import { Transaction, ReportSource } from "./types";
import { SAMPLE_TRANSACTIONS, SAMPLE_SOURCES, COPY_PASTE_TEMPLATES } from "./sampleData";

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Persistence state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("reconciled_transactions");
    return saved ? JSON.parse(saved) : SAMPLE_TRANSACTIONS;
  });

  const [sources, setSources] = useState<ReportSource[]>(() => {
    const saved = localStorage.getItem("reconciled_sources");
    return saved ? JSON.parse(saved) : SAMPLE_SOURCES;
  });

  // UI state
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-06");
  const [searchTerm, setSearchTerm] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<"all" | "sale" | "return">("all");
  const [ledgerSourceFilter, setLedgerSourceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Import panel / Modal state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importSourceName, setImportSourceName] = useState("");
  const [importChannel, setImportChannel] = useState("Shopify");
  const [importRawText, setImportRawText] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileError, setReconcileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("reconciled_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("reconciled_sources", JSON.stringify(sources));
  }, [sources]);

  // Available months list dynamically extracted from transactions
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse(); // Decending
  }, [transactions]);

  // Adjust selected month if it is no longer available
  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedMonth) && selectedMonth !== "All") {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Helper: Reset to Sample Data
  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data back to the default sample reports? This will overwrite your custom imports.")) {
      setTransactions(SAMPLE_TRANSACTIONS);
      setSources(SAMPLE_SOURCES);
      setSelectedMonth("2026-06");
      setSuccessMessage("Successfully reset dashboard to demo reports.");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Helper: Delete a data source and all its compiled transactions
  const handleDeleteSource = (sourceName: string, sourceId: string) => {
    if (window.confirm(`Are you sure you want to delete "${sourceName}"? All ${transactions.filter(t => t.source === sourceName).length} associated sales records will be removed.`)) {
      setTransactions(prev => prev.filter(t => t.source !== sourceName));
      setSources(prev => prev.filter(s => s.id !== sourceId));
      setSuccessMessage(`Successfully deleted source "${sourceName}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Import template paste helper
  const handleApplyTemplate = (templateText: string, name: string, channel: string) => {
    setImportRawText(templateText);
    setImportSourceName(`${name}`);
    setImportChannel(channel);
  };

  // Gemini API client-side trigger
  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importSourceName.trim()) {
      setReconcileError("Please enter a descriptive report name.");
      return;
    }
    if (!importRawText.trim()) {
      setReconcileError("Please paste raw report text or click a template below.");
      return;
    }

    setIsReconciling(true);
    setReconcileError(null);

    try {
      const response = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceName: importSourceName.trim(),
          channel: importChannel,
          rawText: importRawText
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to parse report.");
      }

      // Add report source entry
      const newSource: ReportSource = {
        id: `source-${Date.now()}`,
        name: importSourceName.trim(),
        channel: importChannel,
        recordCount: data.recordCount,
        addedAt: new Date().toISOString(),
        status: "processed"
      };

      setSources(prev => [newSource, ...prev]);
      setTransactions(prev => [...data.transactions, ...prev]);

      // Focus on the month of the first transaction imported
      if (data.transactions.length > 0) {
        const txDate = data.transactions[0].date;
        if (txDate && txDate.length >= 7) {
          setSelectedMonth(txDate.substring(0, 7));
        }
      }

      setSuccessMessage(`Reconciliation complete! Gemini parsed ${data.recordCount} individual transactions.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Reset form & close
      setImportSourceName("");
      setImportRawText("");
      setIsImportOpen(false);

    } catch (err: any) {
      console.error(err);
      setReconcileError(err.message || "An unexpected error occurred during processing.");
    } finally {
      setIsReconciling(false);
    }
  };

  // --- CALCULATION ENGINE ---

  // Transactions filtered by active month
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "All") return transactions;
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Net metrics for selected month
  const currentMonthMetrics = useMemo(() => {
    let salesCount = 0;
    let returnsCount = 0;
    let grossSales = 0;
    let totalReturns = 0;

    filteredTransactions.forEach(t => {
      if (t.type === "sale") {
        salesCount += t.quantity;
        grossSales += t.amount;
      } else {
        returnsCount += t.quantity;
        totalReturns += t.amount;
      }
    });

    return {
      salesCount,
      returnsCount,
      grossSales,
      totalReturns,
      netSales: grossSales - totalReturns,
      totalTxCount: filteredTransactions.length
    };
  }, [filteredTransactions]);

  // MoM Percentage Change calculations
  const momCalculations = useMemo(() => {
    if (selectedMonth === "All" || !selectedMonth) {
      return { available: false, revChange: 0, txChange: 0, retChange: 0 };
    }

    // Get previous month string
    const [year, month] = selectedMonth.split("-").map(Number);
    let prevMonthNum = month - 1;
    let prevYear = year;
    if (prevMonthNum === 0) {
      prevMonthNum = 12;
      prevYear -= 1;
    }
    const priorMonthStr = `${prevYear}-${prevMonthNum.toString().padStart(2, '0')}`;

    // Filter prior transactions
    const priorTransactions = transactions.filter(t => t.date && t.date.startsWith(priorMonthStr));

    let priorGrossSales = 0;
    let priorTotalReturns = 0;
    let priorTxCount = priorTransactions.length;
    let priorReturnsCount = 0;

    priorTransactions.forEach(t => {
      if (t.type === "sale") {
        priorGrossSales += t.amount;
      } else {
        priorTotalReturns += t.amount;
        priorReturnsCount += t.quantity;
      }
    });

    const priorNetSales = priorGrossSales - priorTotalReturns;

    const currentNetSales = currentMonthMetrics.netSales;
    const currentTxCount = currentMonthMetrics.totalTxCount;
    const currentReturnsCount = currentMonthMetrics.returnsCount;

    // Percent changes
    const revChange = priorNetSales > 0 
      ? ((currentNetSales - priorNetSales) / priorNetSales) * 100 
      : currentNetSales > 0 ? 100 : 0;

    const txChange = priorTxCount > 0 
      ? ((currentTxCount - priorTxCount) / priorTxCount) * 100 
      : currentTxCount > 0 ? 100 : 0;

    const retChange = priorReturnsCount > 0 
      ? ((currentReturnsCount - priorReturnsCount) / priorReturnsCount) * 100 
      : currentReturnsCount > 0 ? 100 : 0;

    return {
      available: transactions.some(t => t.date && t.date.startsWith(priorMonthStr)),
      priorMonthName: new Date(prevYear, prevMonthNum - 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
      priorNetSales,
      priorTxCount,
      priorReturnsCount,
      revChange,
      txChange,
      retChange
    };
  }, [transactions, selectedMonth, currentMonthMetrics]);

  // 1. Ranking of Most Popular Items
  const popularItemsRanking = useMemo(() => {
    const itemMap = new Map<string, { quantity: number; amount: number }>();
    
    filteredTransactions.forEach(t => {
      if (t.type === "sale") {
        const existing = itemMap.get(t.item) || { quantity: 0, amount: 0 };
        itemMap.set(t.item, {
          quantity: existing.quantity + t.quantity,
          amount: existing.amount + t.amount
        });
      }
    });

    return Array.from(itemMap.entries())
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        revenue: stats.amount
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredTransactions]);

  // 2. Region with Most Purchases
  const regionalPurchases = useMemo(() => {
    const regionMap = new Map<string, { salesCount: number; netRevenue: number }>();

    filteredTransactions.forEach(t => {
      const existing = regionMap.get(t.region) || { salesCount: 0, netRevenue: 0 };
      if (t.type === "sale") {
        regionMap.set(t.region, {
          salesCount: existing.salesCount + t.quantity,
          netRevenue: existing.netRevenue + t.amount
        });
      } else {
        regionMap.set(t.region, {
          salesCount: existing.salesCount, // returns don't count as purchases
          netRevenue: existing.netRevenue - t.amount
        });
      }
    });

    const list = Array.from(regionMap.entries())
      .map(([name, stats]) => ({
        name,
        salesCount: stats.salesCount,
        revenue: stats.netRevenue
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalRev = list.reduce((acc, curr) => acc + Math.max(0, curr.revenue), 0);

    return {
      list: list.map(item => ({
        ...item,
        percentage: totalRev > 0 ? (Math.max(0, item.revenue) / totalRev) * 100 : 0
      })),
      top: list.length > 0 ? list[0] : null
    };
  }, [filteredTransactions]);

  // 3. Most Returned Items
  const mostReturnedItems = useMemo(() => {
    const returnMap = new Map<string, { quantity: number; amount: number }>();

    filteredTransactions.forEach(t => {
      if (t.type === "return") {
        const existing = returnMap.get(t.item) || { quantity: 0, amount: 0 };
        returnMap.set(t.item, {
          quantity: existing.quantity + t.quantity,
          amount: existing.amount + t.amount
        });
      }
    });

    return Array.from(returnMap.entries())
      .map(([name, stats]) => ({
        name,
        quantity: stats.quantity,
        refundAmount: stats.amount
      }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredTransactions]);

  // Format Helpers
  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(val);
  };

  const getMonthLabel = (ym: string) => {
    if (ym === "All") return "All Time Report";
    const [year, month] = ym.split("-").map(Number);
    return new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  // --- LEDGER FILTERING & PAGINATION ---
  const ledgerFilteredTransactions = useMemo(() => {
    return filteredTransactions.filter(t => {
      // Search
      const matchesSearch = 
        t.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.region.toLowerCase().includes(searchTerm.toLowerCase());

      // Type
      const matchesType = 
        ledgerTypeFilter === "all" || 
        t.type === ledgerTypeFilter;

      // Source System
      const matchesSource = 
        ledgerSourceFilter === "all" || 
        t.source === ledgerSourceFilter;

      return matchesSearch && matchesType && matchesSource;
    });
  }, [filteredTransactions, searchTerm, ledgerTypeFilter, ledgerSourceFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ledgerTypeFilter, ledgerSourceFilter, selectedMonth]);

  const totalLedgerPages = Math.ceil(ledgerFilteredTransactions.length / itemsPerPage);
  const ledgerPageItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return ledgerFilteredTransactions.slice(start, start + itemsPerPage);
  }, [ledgerFilteredTransactions, currentPage]);

  // Export compiled CSV helper
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Date", "Item Name", "Amount", "Quantity", "Region", "Channel/Source", "Type"];
    const rows = ledgerFilteredTransactions.map(t => [
      t.id,
      t.date,
      `"${t.item.replace(/"/g, '""')}"`,
      t.amount,
      t.quantity,
      `"${t.region}"`,
      `"${t.source}"`,
      t.type
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reconciled_Sales_Report_${selectedMonth.replace("-", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`}>
      {/* SUCCESS NOTIFICATION TOP */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-indigo-50" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">Multi-Channel Sales Reconciler</h1>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] uppercase tracking-wider rounded-full border border-indigo-500/30 font-semibold">
                  AI-Powered
                </span>
              </div>
              <p className="text-xs text-slate-400">Consolidate multiple reporting ledgers into a structured central dashboard</p>
            </div>
          </div>

          {/* ACTION ACTIONS */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <button
              onClick={handleResetData}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Restores original preloaded demo reports."
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset to Demo Data
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Import New Report
            </button>
          </div>
        </div>
      </header>

      {/* FILTER & METRIC CONTROLS BAR */}
      <div className={`transition-colors duration-200 border-b ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Report Focus:</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedMonth("All")}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                  selectedMonth === "All"
                    ? (isDarkMode ? "bg-white text-slate-950 font-bold shadow-sm" : "bg-slate-900 text-white shadow-sm")
                    : (isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }`}
              >
                All Time ({transactions.length})
              </button>
              {availableMonths.map(ym => (
                <button
                  key={ym}
                  onClick={() => setSelectedMonth(ym)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                    selectedMonth === ym
                      ? "bg-indigo-600 text-white shadow-sm"
                      : (isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                  }`}
                >
                  {getMonthLabel(ym)}
                </button>
              ))}
            </div>
          </div>
          
          <div className={`text-right text-xs font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Active Dataset: <span className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>{filteredTransactions.length}</span> reconciled rows from <span className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>{sources.length}</span> unique systems
          </div>
        </div>
      </div>

      {/* THEME SWITCHER BAR */}
      <div className={`border-b transition-colors duration-200 ${isDarkMode ? "bg-slate-900/40 border-slate-800 text-slate-200" : "bg-slate-100/60 border-slate-200 text-slate-700"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold uppercase tracking-wider text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Active Theme:</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-200 text-slate-700"}`}>
              {isDarkMode ? "Dark Modern Theme" : "Light Elegant Theme"}
            </span>
          </div>
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer shadow-xs ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-750 text-indigo-400 border-slate-700 hover:border-slate-600" 
                : "bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 hover:border-indigo-200"
            }`}
          >
            {isDarkMode ? (
              <>
                <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.46 5.05L5.75 4.343a1 1 0 10-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                <span>Switch to Light Mode</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
                <span>Switch to Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* KEY STATS PANEL */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* MOM ACTIVITY CHANGE */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MoM Activity Change</span>
                <span className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-500"}`}>
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              
              {selectedMonth === "All" ? (
                <div className="py-2">
                  <div className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>All-Time Cumulative</div>
                  <p className="text-xs text-slate-400 mt-1">Select a specific month to see percentage change metrics compared with prior months.</p>
                </div>
              ) : !momCalculations.available ? (
                <div className="py-2">
                  <div className={`text-2xl font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>-- %</div>
                  <p className="text-xs text-slate-400 mt-1">No preceding month data in ledger to calculate change percentage.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-black tracking-tight ${momCalculations.revChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {momCalculations.revChange >= 0 ? "+" : ""}
                      {momCalculations.revChange.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Net Sales</span>
                  </div>
                  
                  {/* Additional mini percent comparisons */}
                  <div className={`pt-2 border-t flex justify-between text-[11px] ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}>
                    <div>
                      Tx Volume:{" "}
                      <span className={`font-semibold ${momCalculations.txChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {momCalculations.txChange >= 0 ? "+" : ""}
                        {momCalculations.txChange.toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      Refund Count:{" "}
                      <span className={`font-semibold ${momCalculations.retChange <= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {momCalculations.retChange >= 0 ? "+" : ""}
                        {momCalculations.retChange.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={`text-[10px] text-slate-400 mt-3 pt-2 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              {selectedMonth !== "All" && momCalculations.available ? (
                <span>Compared against <strong className={`${isDarkMode ? "text-slate-300" : "text-slate-600"} font-semibold`}>{momCalculations.priorMonthName}</strong> ({formatMoney(momCalculations.priorNetSales)})</span>
              ) : (
                <span>Tracking transactional activity velocity</span>
              )}
            </div>
          </div>

          {/* TOP REGION */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Purchasing Region</span>
                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase rounded-md ${isDarkMode ? "bg-indigo-950/40 border-indigo-900/60 text-indigo-300" : "bg-indigo-50 border-indigo-100 text-indigo-600"}`}>
                  Region Focus
                </span>
              </div>

              {regionalPurchases.top ? (
                <div className="space-y-1">
                  <div className={`text-2xl font-black tracking-tight truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {regionalPurchases.top.name}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    Net Revenue: <strong className={`${isDarkMode ? "text-slate-200" : "text-slate-800"} font-semibold`}>{formatMoney(regionalPurchases.top.revenue)}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                    <span>Accounted for</span>
                    <span className={`font-bold px-1 rounded ${isDarkMode ? "text-indigo-400 bg-indigo-950/40" : "text-indigo-600 bg-indigo-50"}`}>
                      {regionalPurchases.list[0]?.percentage.toFixed(0)}%
                    </span>
                    <span>of selected month sales</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-slate-400 text-xs italic">No purchase regions found.</div>
              )}
            </div>

            <div className={`text-[10px] text-slate-400 mt-3 pt-2 border-t flex items-center justify-between ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <span>Primary geographical channel</span>
              {regionalPurchases.top && (
                <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{regionalPurchases.top.salesCount} total purchases</span>
              )}
            </div>
          </div>

          {/* MOST POPULAR ITEM */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Most Popular Item</span>
                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase rounded-md ${isDarkMode ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-600"}`}>
                  Best Seller
                </span>
              </div>

              {popularItemsRanking.length > 0 ? (
                <div className="space-y-1">
                  <div className={`text-base font-black tracking-tight leading-tight truncate ${isDarkMode ? "text-white" : "text-slate-900"}`} title={popularItemsRanking[0].name}>
                    {popularItemsRanking[0].name}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    Gross Units Sold: <strong className={`${isDarkMode ? "text-slate-200" : "text-slate-800"} font-semibold`}>{popularItemsRanking[0].quantity}</strong>
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    Total Revenue: <strong className="text-emerald-500 font-semibold">{formatMoney(popularItemsRanking[0].revenue)}</strong>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-slate-400 text-xs italic">No items found.</div>
              )}
            </div>

            <div className={`text-[10px] text-slate-400 mt-3 pt-2 border-t flex items-center justify-between ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <span>Top quantity leaderboard</span>
              {popularItemsRanking.length > 0 && (
                <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Unit leader</span>
              )}
            </div>
          </div>

          {/* MOST RETURNED ITEM */}
          <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Most Returned Item</span>
                <span className={`px-2 py-0.5 border text-[10px] font-bold uppercase rounded-md ${isDarkMode ? "bg-rose-950/40 border-rose-900/60 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-600"}`}>
                  Refund Risk
                </span>
              </div>

              {mostReturnedItems.length > 0 ? (
                <div className="space-y-1">
                  <div className={`text-base font-black tracking-tight leading-tight truncate ${isDarkMode ? "text-white" : "text-slate-900"}`} title={mostReturnedItems[0].name}>
                    {mostReturnedItems[0].name}
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    Total Returns: <strong className="text-rose-500 font-semibold">{mostReturnedItems[0].quantity} units</strong>
                  </div>
                  <div className="text-xs font-medium text-slate-400">
                    Total Refund Value: <strong className="text-rose-500 font-semibold">{formatMoney(mostReturnedItems[0].refundAmount)}</strong>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="text-sm font-bold text-emerald-500">Perfect Month!</div>
                  <p className="text-xs text-slate-400 mt-0.5">Zero return actions recorded in current month's datasets.</p>
                </div>
              )}
            </div>

            <div className={`text-[10px] text-slate-400 mt-3 pt-2 border-t flex items-center justify-between ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <span>Requires onboarding review</span>
              {mostReturnedItems.length > 0 && (
                <span className={`font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Refunding</span>
              )}
            </div>
          </div>

        </section>

        {/* METRIC ANALYSIS CHARTS & SOURCE REPORTS LIST */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* POPULAR ITEMS RANKING (RECHARTS BAR CHART) - Span 2 Columns */}
          <div className={`lg:col-span-2 rounded-2xl border shadow-sm p-6 flex flex-col justify-between transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-1 pb-4">
              <h3 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Popular Item Rankings</h3>
              <p className="text-xs text-slate-400">Visual ranking of all products sold during the selected period by gross units</p>
            </div>

            {popularItemsRanking.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={popularItemsRanking.slice(0, 5)}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    barSize={32}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => val.length > 18 ? `${val.substring(0, 15)}...` : val}
                    />
                    <YAxis 
                      tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc' }}
                      contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#1e293b', borderRadius: '8px', border: isDarkMode ? '1px solid #334155' : 'none', color: '#fff' }}
                      itemStyle={{ color: '#818cf8', fontSize: '12px' }}
                      labelStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#fff' }}
                      formatter={(value: any) => [`${value} units`, 'Quantity Sold']}
                    />
                    <Bar dataKey="quantity" fill="#6366f1" radius={[6, 6, 0, 0]}>
                      {popularItemsRanking.slice(0, 5).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === 0 ? "#4f46e5" : index === 1 ? "#6366f1" : index === 2 ? "#818cf8" : "#a5b4fc"} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={`h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed rounded-xl ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                <Info className="w-8 h-8 text-slate-300" />
                <span className="text-sm">No sales data available to plot chart.</span>
              </div>
            )}

            <div className={`mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs font-semibold ${isDarkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"}`}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#4f46e5]"></span> Top Seller
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#6366f1]"></span> Runner Up
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#a5b4fc]"></span> Moderate Volume
              </span>
            </div>
          </div>

          {/* ACTIVE REPORT SOURCES / CHANNEL SYSTEMS */}
          <div className={`rounded-2xl border shadow-sm p-6 flex flex-col justify-between transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-1 pb-4">
              <h3 className={`text-sm font-bold uppercase tracking-wide font-sans ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Active Data Reports</h3>
              <p className="text-xs text-slate-400">Currently compiled reports feeding the active dashboard metrics</p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[17rem] pr-1 space-y-3">
              {sources.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center space-y-2">
                  <Database className="w-8 h-8 text-slate-300" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">No data reports loaded</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Paste or upload a channel report to start analysis.</p>
                  </div>
                </div>
              ) : (
                sources.map(source => (
                  <div 
                    key={source.id} 
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${isDarkMode ? "bg-slate-950/60 border-slate-800 hover:bg-slate-800/40" : "bg-slate-50 hover:bg-slate-100/80 border-slate-200"}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          source.channel === "Shopify" ? "bg-emerald-500" :
                          source.channel === "Amazon" ? "bg-orange-500" :
                          source.channel === "POS" ? "bg-indigo-500" : "bg-slate-500"
                        }`} />
                        <h4 className={`text-xs font-bold truncate ${isDarkMode ? "text-white" : "text-slate-800"}`} title={source.name}>
                          {source.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold text-slate-400">
                        <span className={`px-1.5 py-0.5 rounded uppercase ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-200 text-slate-700"}`}>{source.channel}</span>
                        <span>•</span>
                        <span>{source.recordCount} rows parsed</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSource(source.name, source.id)}
                      className={`p-1.5 text-slate-400 rounded-lg transition-all cursor-pointer ${isDarkMode ? "hover:text-rose-400 hover:bg-rose-950/40" : "hover:text-rose-600 hover:bg-rose-50"}`}
                      title="Deletes this source and associated sales records"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={`mt-4 pt-4 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
              <button
                onClick={() => setIsImportOpen(true)}
                className={`w-full py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isDarkMode ? "bg-indigo-950/40 hover:bg-indigo-900/60 border-indigo-800 text-indigo-300" : "bg-indigo-50 hover:bg-indigo-100/70 border-indigo-200 text-indigo-700"}`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add & Reconcile Another Report
              </button>
            </div>
          </div>

        </section>

        {/* REGIONAL PURCHASE DISTRIBUTIONS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* REGIONAL PURCHASE DISTRIBUTION PROGRESS BAR */}
          <div className={`rounded-2xl border shadow-sm p-6 space-y-4 transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-1">
              <h3 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Regional Net Revenue Split</h3>
              <p className="text-xs text-slate-400">Total monetary value of purchases minus returns per geographical territory</p>
            </div>

            <div className="space-y-4 pt-2">
              {regionalPurchases.list.length > 0 ? (
                regionalPurchases.list.map((reg, index) => (
                  <div key={reg.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>{index + 1}. {reg.name}</span>
                        <span className="text-[10px] text-slate-400">({reg.salesCount} purchases)</span>
                      </div>
                      <span className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>{formatMoney(reg.revenue)}</span>
                    </div>
                    
                    <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? "bg-indigo-600" :
                          index === 1 ? "bg-indigo-400" :
                          index === 2 ? "bg-indigo-300" : "bg-slate-400"
                        }`}
                        style={{ width: `${Math.max(1, reg.percentage)}%` }}
                      />
                    </div>
                    <div className="flex justify-end text-[10px] text-slate-400">
                      <span>{reg.percentage.toFixed(1)}% share</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">No regional data recorded.</div>
              )}
            </div>
          </div>

          {/* ITEM RETURN LEADERBOARD */}
          <div className={`rounded-2xl border shadow-sm p-6 space-y-4 transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="space-y-1">
              <h3 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Refunded Items Leaderboard</h3>
              <p className="text-xs text-slate-400">Itemized returns list sorted by count of refunded items</p>
            </div>

            <div className={`divide-y overflow-y-auto max-h-72 ${isDarkMode ? "divide-slate-800" : "divide-slate-100"}`}>
              {mostReturnedItems.length > 0 ? (
                mostReturnedItems.map((ret, index) => (
                  <div key={ret.name} className="py-3 flex justify-between items-center gap-2">
                    <div className="min-w-0">
                      <span className={`text-xs font-bold truncate block ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{ret.name}</span>
                      <span className="text-[10px] text-slate-400">{ret.quantity} units returned</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-rose-500 font-mono">-{formatMoney(ret.refundAmount)}</span>
                      <span className="text-[10px] text-slate-400 block font-semibold">REFUND</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs italic">
                  Excellent! No product returns recorded in selected months.
                </div>
              )}
            </div>
          </div>

        </section>

        {/* CENTRAL COMPILED SALES LEDGER */}
        <section className={`rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          
          {/* LEDGER BAR */}
          <div className={`p-6 border-b space-y-4 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className={`text-base font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Central Compiled Report Ledger</h3>
                <p className="text-xs text-slate-400">Comprehensive searchable directory of all parsed, consolidated transactions</p>
              </div>
              
              <button
                onClick={handleExportCSV}
                disabled={ledgerFilteredTransactions.length === 0}
                className={`px-4 py-2 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer self-start md:self-center ${isDarkMode ? "bg-indigo-600 hover:bg-indigo-500" : "bg-slate-950 hover:bg-slate-900"}`}
              >
                <Download className="w-4 h-4" />
                Export Ledger (CSV)
              </button>
            </div>

            {/* SEARCH AND LEDGER FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search item, region, or channel name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-colors ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50/50 border-slate-200 text-slate-900"}`}
                />
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Type:</span>
                <select
                  value={ledgerTypeFilter}
                  onChange={(e: any) => setLedgerTypeFilter(e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50/50 border-slate-200 text-slate-900"}`}
                >
                  <option value="all">All Types</option>
                  <option value="sale">Purchases (Sales)</option>
                  <option value="return">Returns (Refunds)</option>
                </select>
              </div>

              {/* System Filter */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Source:</span>
                <select
                  value={ledgerSourceFilter}
                  onChange={(e) => setLedgerSourceFilter(e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-colors ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50/50 border-slate-200 text-slate-900"}`}
                >
                  <option value="all">All Channels</option>
                  {Array.from(new Set(transactions.map(t => t.source))).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-slate-400 font-semibold text-[10px] uppercase tracking-wider ${isDarkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <th className="py-3 px-6">Transaction ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product / Item</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4">Source Ledger</th>
                  <th className="py-3 px-6 text-center">Type</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs font-medium ${isDarkMode ? "divide-slate-800 text-slate-300" : "divide-slate-100 text-slate-700"}`}>
                {ledgerPageItems.length > 0 ? (
                  ledgerPageItems.map(t => (
                    <tr key={t.id} className={`transition-colors ${isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/50"}`}>
                      <td className="py-3 px-6 font-mono text-[10px] text-slate-500 font-semibold">{t.id}</td>
                      <td className={`py-3 px-4 whitespace-nowrap ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{t.date}</td>
                      <td className={`py-3 px-4 font-bold truncate max-w-xs ${isDarkMode ? "text-white" : "text-slate-900"}`}>{t.item}</td>
                      <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                        <span className={t.type === "return" ? "text-rose-500" : isDarkMode ? "text-slate-200" : "text-slate-900"}>
                          {t.type === "return" ? "-" : ""}{formatMoney(t.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">{t.quantity}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>{t.region}</span>
                      </td>
                      <td className={`py-3 px-4 truncate max-w-[150px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} title={t.source}>{t.source}</td>
                      <td className="py-3 px-6 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          t.type === "return"
                            ? isDarkMode ? "bg-rose-950/40 text-rose-300 border border-rose-900/60" : "bg-rose-50 text-rose-700 border border-rose-200"
                            : isDarkMode ? "bg-emerald-950/40 text-emerald-300 border border-emerald-900/60" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {t.type === "return" ? "Return" : "Sale"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      No matching sales records found. Try adjusting your search queries or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* LEDGER PAGINATION FOOTER */}
          {totalLedgerPages > 1 && (
            <div className={`px-6 py-4 border-t flex items-center justify-between text-xs ${isDarkMode ? "bg-slate-950/40 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
              <span>
                Showing page <strong className={isDarkMode ? "text-slate-200" : "text-slate-800"}>{currentPage}</strong> of <strong className={isDarkMode ? "text-slate-200" : "text-slate-800"}>{totalLedgerPages}</strong> (filtered <strong className={isDarkMode ? "text-slate-200" : "text-slate-800"}>{ledgerFilteredTransactions.length}</strong> of {filteredTransactions.length} entries)
              </span>

              <div className="flex gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={`px-3 py-1.5 disabled:opacity-50 border rounded-lg font-semibold transition-all cursor-pointer ${isDarkMode ? "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"}`}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalLedgerPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalLedgerPages, prev + 1))}
                  className={`px-3 py-1.5 disabled:opacity-50 border rounded-lg font-semibold transition-all cursor-pointer ${isDarkMode ? "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* FOOTER METADATA */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="font-bold text-white text-sm">Standalone Multi-Channel Sales Reconciler</div>
            <p>Designed for payment onboarding managers to consolidate system reports without database lock-in.</p>
          </div>
          <div>
            <span>Local file persistence enabled • Offline State • </span>
            <span className="text-indigo-400 hover:underline cursor-pointer" onClick={() => setIsImportOpen(true)}>Import Data</span>
          </div>
        </div>
      </footer>

      {/* IMPORT NEW DATA DRAWER / MODAL */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className={`w-full max-w-2xl shadow-2xl flex flex-col justify-between h-full border-l animate-slide-in transition-all duration-200 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            
            {/* HEADER */}
            <div className={`p-6 border-b text-white flex justify-between items-center shrink-0 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-900 border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Upload className="w-5 h-5 text-indigo-50" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Reconcile New Sales Report</h3>
                  <p className="text-xs text-slate-400">Pasted reports are formatted instantly using Gemini 3.5 Flash</p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportOpen(false)}
                className={`p-1 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-slate-800"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleReconcile} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {reconcileError && (
                <div className={`p-4 border rounded-xl text-xs flex gap-2.5 items-start ${isDarkMode ? "bg-rose-950/40 border-rose-900/60 text-rose-300" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Parsing Issue:</span> {reconcileError}
                    <p className={`mt-1 text-[11px] font-semibold ${isDarkMode ? "text-rose-400" : "text-rose-600"}`}>Make sure process.env.GEMINI_API_KEY is configured correctly under Settings &gt; Secrets.</p>
                  </div>
                </div>
              )}

              {/* REPORT NAME */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Descriptive Report Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shopify US Store July 2026"
                  value={importSourceName}
                  onChange={(e) => setImportSourceName(e.target.value)}
                  className={`w-full border px-3.5 py-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600" : "bg-slate-50/50 border-slate-200 text-slate-900"}`}
                />
              </div>

              {/* CHANNEL SYSTEM */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Origin Channel</label>
                <div className="grid grid-cols-5 gap-2">
                  {["Shopify", "Amazon", "POS", "Stripe", "Custom"].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setImportChannel(ch)}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-bold uppercase transition-all cursor-pointer ${
                        importChannel === ch
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : isDarkMode
                            ? "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800/60"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAW REPORT PASTED TEXT */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Raw Report Data / Ledger Paste</label>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"}`}>Gemini Auto-Schema</span>
                </div>
                <textarea
                  placeholder="Paste unstructured transactions, TSV rows, custom CSV content, or text ledgers here. Format doesn't need to be clean—Gemini will analyze, map parameters, extract date/amounts, and return structured JSON records."
                  value={importRawText}
                  onChange={(e) => setImportRawText(e.target.value)}
                  rows={8}
                  required
                  className={`w-full border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono transition-colors ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600" : "bg-slate-50/50 border-slate-200 text-slate-900"}`}
                />
              </div>

              {/* PRE-FORMATTED DEMO TEMPLATES COPIER */}
              <div className={`space-y-3 pt-3 border-t ${isDarkMode ? "border-slate-800" : "border-slate-100"}`}>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Quick Test Templates (Click to paste)</span>
                </div>
                <p className="text-[10px] text-slate-400">Pasting large tables can be tricky. Try copy-pasting or click one of these realistic pre-formatted system reports to test Gemini's parsing immediately:</p>
                
                <div className="space-y-2">
                  {COPY_PASTE_TEMPLATES.map(temp => (
                    <button
                      key={temp.name}
                      type="button"
                      onClick={() => handleApplyTemplate(temp.text, temp.name, temp.channel)}
                      className={`w-full text-left p-3 border rounded-xl flex items-center justify-between text-xs transition-all cursor-pointer group ${isDarkMode ? "bg-slate-950/60 border-slate-800 hover:bg-slate-850" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                    >
                      <div>
                        <span className={`font-bold block ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>{temp.name}</span>
                        <span className="text-[10px] text-slate-400">Originated from {temp.channel} report format</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

            </form>

            {/* BUTTON BAR FOOTER */}
            <div className={`p-6 border-t flex items-center gap-3 shrink-0 ${isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className={`flex-1 py-2.5 text-center border rounded-xl text-xs font-semibold transition-all cursor-pointer ${isDarkMode ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800" : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReconcile}
                disabled={isReconciling}
                className="flex-1 py-2.5 text-center bg-indigo-600 hover:bg-indigo-500 disabled:opacity-80 active:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isReconciling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini Reconciling...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reconcile with Gemini AI</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
