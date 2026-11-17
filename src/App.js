
import React, { useMemo, useState } from "react";
import "./App.css";

/**
 * SOCIETY CONFIGURATION
 * Stores the official society identity and branding information.
 */
const SOCIETY = {
  name: "Delhi Laxmi Co-operative",
  subtitle: "Thrift & Credit Society",
  registrationNumber: "10636",
  logo: "/assets/delhi-laxmi-logo.png",
};

/**
 * INITIAL ACCOUNT DETAILS
 * Replace these sample values with actual customer records or API data.
 */
const INITIAL_ACCOUNT = {
  holder: "Rajesh Kumar",
  accountNumber: "DLX-100245",
  membershipNumber: "M-2024-0185",
  accountType: "Savings Account",
  mobile: "9876543210",
  openingBalance: 15000,
  fromDate: "2026-11-01",
  toDate: "2026-11-30",
};

/**
 * SAMPLE TRANSACTION RECORDS
 * Each transaction contains a unique ID, date, description,
 * credit amount and debit amount.
 */
const INITIAL_TRANSACTIONS = [
  {
    id: "DLX-2026-001",
    date: "2026-11-02",
    particulars: "Monthly Savings Deposit",
    credit: 2000,
    debit: 0,
  },
  {
    id: "DLX-2026-002",
    date: "2026-11-05",
    particulars: "Cash Withdrawal",
    credit: 0,
    debit: 500,
  },
  {
    id: "DLX-2026-003",
    date: "2026-11-09",
    particulars: "Interest Credit",
    credit: 350,
    debit: 0,
  },
  {
    id: "DLX-2026-004",
    date: "2026-11-12",
    particulars: "Monthly Savings Deposit",
    credit: 1500,
    debit: 0,
  },
];

/**
 * CURRENCY FORMATTER
 * Formats numeric amounts into Indian Rupees with two decimals.
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * DATE FORMATTER
 * Converts YYYY-MM-DD into DD-MM-YYYY.
 */
const formatDate = (date) => {
  if (!date) return "-";

  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
};

/**
 * GENERATES A UNIQUE TRANSACTION REFERENCE.
 * Uses the current timestamp to create a simple reference ID.
 * Production systems should generate IDs on the backend.
 */
const generateTransactionId = () => {
  return `DLX-${Date.now()}`;
};

/**
 * CSV VALUE FORMATTER
 * Escapes commas and quotation marks in exported values.
 */
const escapeCSV = (value) => {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
};

/**
 * MAIN APPLICATION
 * Manages customer details, transactions, account calculations,
 * transaction validation, search, export and printing.
 */
function App() {
  const [account, setAccount] = useState(INITIAL_ACCOUNT);

  const [transactions, setTransactions] = useState(
    INITIAL_TRANSACTIONS
  );

  const [search, setSearch] = useState("");

  const [activePage, setActivePage] = useState("Statements");

  const [menuOpen, setMenuOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    particulars: "",
    credit: "",
    debit: "",
  });

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /**
   * SORTS TRANSACTIONS CHRONOLOGICALLY AND CALCULATES
   * THE RUNNING BALANCE FOR EVERY TRANSACTION.
   *
   * Blank transactions are not included in calculations.
   */
  const ledger = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateDifference = a.date.localeCompare(b.date);

      if (dateDifference !== 0) return dateDifference;

      return a.id.localeCompare(b.id);
    });

    let runningBalance = Number(account.openingBalance) || 0;

    return sortedTransactions.map((transaction, index) => {
      runningBalance += transaction.credit - transaction.debit;

      return {
        ...transaction,
        serial: index + 1,
        balance: runningBalance,
      };
    });
  }, [transactions, account.openingBalance]);

  /**
   * CALCULATES TOTAL CREDIT, TOTAL DEBIT,
   * OPENING BALANCE AND CLOSING BALANCE.
   */
  const summary = useMemo(() => {
    const totalCredit = transactions.reduce(
      (total, item) => total + item.credit,
      0
    );

    const totalDebit = transactions.reduce(
      (total, item) => total + item.debit,
      0
    );

    return {
      openingBalance: Number(account.openingBalance) || 0,
      totalCredit,
      totalDebit,
      closingBalance:
        Number(account.openingBalance) + totalCredit - totalDebit,
      totalTransactions: transactions.length,
    };
  }, [transactions, account.openingBalance]);

  /**
   * FILTERS TRANSACTIONS BY SEARCH TEXT AND DATE RANGE.
   * The balance shown is the chronological account balance,
   * not a recalculated balance for the filtered subset.
   */
  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        item.id.toLowerCase().includes(searchValue) ||
        item.particulars.toLowerCase().includes(searchValue) ||
        item.date.includes(searchValue);

      const matchesFromDate =
        !dateFrom || item.date >= dateFrom;

      const matchesToDate =
        !dateTo || item.date <= dateTo;

      return matchesSearch && matchesFromDate && matchesToDate;
    });
  }, [ledger, search, dateFrom, dateTo]);

  /**
   * HANDLES TRANSACTION FORM INPUT CHANGES.
   */
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /**
   * ADDS A NEW TRANSACTION.
   *
   * Validates transaction date, description and amounts.
   * Allows either credit or debit, never both together.
   */
  const handleAddTransaction = (event) => {
    event.preventDefault();

    const credit =
      formData.credit === "" ? 0 : Number(formData.credit);

    const debit =
      formData.debit === "" ? 0 : Number(formData.debit);

    if (!formData.date || !formData.particulars.trim()) {
      alert("Please enter the transaction date and particulars.");
      return;
    }

    if (
      !Number.isFinite(credit) ||
      !Number.isFinite(debit) ||
      credit < 0 ||
      debit < 0
    ) {
      alert("Please enter valid non-negative transaction amounts.");
      return;
    }

    if (
      (credit > 0 && debit > 0) ||
      (credit === 0 && debit === 0)
    ) {
      alert("Enter either a Credit OR a Debit amount.");
      return;
    }

    const transaction = {
      id: generateTransactionId(),
      date: formData.date,
      particulars: formData.particulars.trim(),
      credit,
      debit,
    };

    setTransactions((previous) => [
      ...previous,
      transaction,
    ]);

    setFormData({
      date: new Date().toISOString().slice(0, 10),
      particulars: "",
      credit: "",
      debit: "",
    });
  };

  /**
   * REMOVES A TRANSACTION.
   * This is provided for demonstration purposes.
   * Production deletion should require authorization and audit logging.
   */
  const handleDeleteTransaction = (transactionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) return;

    setTransactions((previous) =>
      previous.filter((item) => item.id !== transactionId)
    );
  };

  /**
   * EXPORTS THE COMPLETE ACCOUNT LEDGER TO CSV.
   * The CSV file can be opened using Microsoft Excel.
   */
  const handleExportCSV = () => {
    const headers = [
      "S.No.",
      "Date",
      "Transaction ID",
      "Particulars",
      "Credit (INR)",
      "Debit (INR)",
      "Balance (INR)",
    ];

    const rows = ledger.map((item) => [
      item.serial,
      formatDate(item.date),
      item.id,
      item.particulars,
      item.credit.toFixed(2),
      item.debit.toFixed(2),
      item.balance.toFixed(2),
    ]);

    const csvContent = [
      [SOCIETY.name, SOCIETY.subtitle],
      ["Account Holder", account.holder],
      ["Account Number", account.accountNumber],
      ["Membership Number", account.membershipNumber],
      ["Account Type", account.accountType],
      ["Mobile Number", account.mobile],
      ["Opening Balance", summary.openingBalance.toFixed(2)],
      [],
      headers,
      ...rows,
      [],
      ["Total Credit", summary.totalCredit.toFixed(2)],
      ["Total Debit", summary.totalDebit.toFixed(2)],
      ["Closing Balance", summary.closingBalance.toFixed(2)],
    ]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Statement-${account.accountNumber}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  /**
   * PRINTS THE CUSTOMER STATEMENT.
   * The browser print dialog can be used to save the statement as PDF.
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * UPDATES CUSTOMER ACCOUNT DETAILS.
   * Keeps the customer information editable in the interface.
   */
  const handleAccountChange = (event) => {
    const { name, value } = event.target;

    setAccount((previous) => ({
      ...previous,
      [name]:
        name === "openingBalance" ? Number(value) : value,
    }));
  };

  /**
   * CLEARS SEARCH AND DATE FILTERS.
   */
  const clearFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="app-layout">

      {/* MOBILE NAVIGATION OVERLAY */}
      {menuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>

        <div className="sidebar-brand">
          <img
            src={SOCIETY.logo}
            alt="Delhi Laxmi Society Logo"
            className="society-logo"
          />

          <div className="sidebar-brand-text">
            <h2>Delhi Laxmi</h2>
            <p>Thrift & Credit Society</p>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="sidebar-label">MAIN MENU</div>

        <nav className="sidebar-nav">
          {[
            { icon: "▦", label: "Dashboard" },
            { icon: "♙", label: "Members" },
            { icon: "▣", label: "Accounts" },
            { icon: "⇄", label: "Transactions" },
            { icon: "▤", label: "Statements" },
            { icon: "⚙", label: "Settings" },
          ].map((item) => (
            <button
              key={item.label}
              className={`nav-item ${
                activePage === item.label ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.label);
                setMenuOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-line" />
          <p>Registration No. {SOCIETY.registrationNumber}</p>
          <span>Delhi, India</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP HEADER */}
        <header className="top-header">

          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>

            <div>
              <p className="breadcrumb">Society Management / {activePage}</p>
              <h1>{activePage}</h1>
            </div>
          </div>

          <div className="header-user">
            <div className="user-avatar">DL</div>
            <div className="user-details">
              <strong>Society Staff</strong>
              <span>Administrator</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <div className="dashboard-container">

          {/* PAGE TITLE AND ACTIONS */}
          <section className="page-heading">
            <div>
              <span className="section-eyebrow">
                MEMBER FINANCIAL RECORDS
              </span>

              <h2>Customer Account Ledger</h2>

              <p>
                Manage customer deposits, withdrawals and account balances.
              </p>
            </div>

            <div className="heading-actions">
              <button
                className="btn btn-outline"
                onClick={handlePrint}
              >
                <span>▤</span> Print / PDF
              </button>

              <button
                className="btn btn-primary"
                onClick={handleExportCSV}
              >
                <span>↓</span> Export CSV
              </button>
            </div>
          </section>

          {/* CUSTOMER INFORMATION */}
          <section className="panel account-panel">

            <div className="panel-heading">
              <div className="panel-heading-icon">♙</div>

              <div>
                <h3>Account Holder Information</h3>
                <p>Customer identity and account details</p>
              </div>

              <span className="status-badge">
                ● Active Account
              </span>
            </div>

            <div className="account-grid">

              <AccountField
                label="Account Holder Name"
                name="holder"
                value={account.holder}
                onChange={handleAccountChange}
              />

              <AccountField
                label="Account Number"
                name="accountNumber"
                value={account.accountNumber}
                onChange={handleAccountChange}
              />

              <AccountField
                label="Membership Number"
                name="membershipNumber"
                value={account.membershipNumber}
                onChange={handleAccountChange}
              />

              <AccountField
                label="Account Type"
                name="accountType"
                value={account.accountType}
                onChange={handleAccountChange}
              />

              <AccountField
                label="Mobile Number"
                name="mobile"
                value={account.mobile}
                onChange={handleAccountChange}
              />

              <AccountField
                label="Statement From"
                name="fromDate"
                type="date"
                value={account.fromDate}
                onChange={handleAccountChange}
              />

              <AccountField
                label="Statement To"
                name="toDate"
                type="date"
                value={account.toDate}
                onChange={handleAccountChange}
              />

              <AccountField
                label="Opening Balance (₹)"
                name="openingBalance"
                type="number"
                value={account.openingBalance}
                onChange={handleAccountChange}
              />

            </div>
          </section>

          {/* FINANCIAL SUMMARY */}
          <section className="summary-grid">

            <SummaryCard
              label="Opening Balance"
              value={formatCurrency(summary.openingBalance)}
              icon="▣"
              color="blue"
            />

            <SummaryCard
              label="Total Credit"
              value={formatCurrency(summary.totalCredit)}
              icon="↗"
              color="green"
            />

            <SummaryCard
              label="Total Debit"
              value={formatCurrency(summary.totalDebit)}
              icon="↙"
              color="red"
            />

            <SummaryCard
              label="Closing Balance"
              value={formatCurrency(summary.closingBalance)}
              icon="₹"
              color="navy"
            />

          </section>

          {/* ADD TRANSACTION FORM */}
          <section className="panel transaction-form-panel">

            <div className="panel-heading">
              <div className="panel-heading-icon">＋</div>

              <div>
                <h3>Add New Transaction</h3>
                <p>Enter a new customer account transaction</p>
              </div>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleAddTransaction}
            >

              <FormField label="Transaction Date">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </FormField>

              <FormField label="Particulars / Description">
                <input
                  type="text"
                  name="particulars"
                  placeholder="e.g. Cash Deposit"
                  value={formData.particulars}
                  onChange={handleInputChange}
                  required
                />
              </FormField>

              <FormField label="Credit Amount (₹)">
                <input
                  type="number"
                  name="credit"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.credit}
                  onChange={handleInputChange}
                />
              </FormField>

              <FormField label="Debit Amount (₹)">
                <input
                  type="number"
                  name="debit"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.debit}
                  onChange={handleInputChange}
                />
              </FormField>

              <button className="btn btn-primary add-button" type="submit">
                ＋ Add Transaction
              </button>

            </form>
          </section>

          {/* TRANSACTION TABLE */}
          <section className="panel ledger-panel">

            <div className="ledger-header">

              <div>
                <h3>Transaction History</h3>
                <p>Complete customer account transaction register</p>
              </div>

              <div className="ledger-count">
                {summary.totalTransactions} Transactions
              </div>

            </div>

            {/* TABLE SEARCH AND FILTERS */}
            <div className="filter-toolbar">

              <div className="search-box">
                <span>⌕</span>

                <input
                  type="search"
                  placeholder="Search transaction ID or particulars..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="date-filter">
                <input
                  type="date"
                  aria-label="Filter from date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                />

                <span>To</span>

                <input
                  type="date"
                  aria-label="Filter to date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                />

                <button
                  type="button"
                  className="clear-filter"
                  onClick={clearFilters}
                >
                  Clear
                </button>
              </div>

            </div>

            {/* TRANSACTION TABLE */}
            <div className="table-wrapper">

              <table className="ledger-table">

                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Date</th>
                    <th>Transaction ID</th>
                    <th>Particulars / Description</th>
                    <th className="text-right">Credit (₹)</th>
                    <th className="text-right">Debit (₹)</th>
                    <th className="text-right">Balance (₹)</th>
                    <th className="no-print">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLedger.length > 0 ? (
                    filteredLedger.map((item) => (
                      <tr key={item.id}>

                        <td>{item.serial}</td>

                        <td className="date-cell">
                          {formatDate(item.date)}
                        </td>

                        <td>
                          <span className="transaction-id">
                            {item.id}
                          </span>
                        </td>

                        <td className="particulars-cell">
                          {item.particulars}
                        </td>

                        <td className="amount-credit text-right">
                          {item.credit > 0
                            ? formatCurrency(item.credit)
                            : "—"}
                        </td>

                        <td className="amount-debit text-right">
                          {item.debit > 0
                            ? formatCurrency(item.debit)
                            : "—"}
                        </td>

                        <td className="amount-balance text-right">
                          {formatCurrency(item.balance)}
                        </td>

                        <td className="no-print">
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDeleteTransaction(item.id)}
                            title="Delete transaction"
                          >
                            ×
                          </button>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="empty-state">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>

            {/* TRANSACTION TOTALS */}
            <div className="ledger-footer">

              <div className="footer-summary">
                <span>Total Credit</span>
                <strong className="amount-credit">
                  {formatCurrency(summary.totalCredit)}
                </strong>
              </div>

              <div className="footer-summary">
                <span>Total Debit</span>
                <strong className="amount-debit">
                  {formatCurrency(summary.totalDebit)}
                </strong>
              </div>

              <div className="footer-summary">
                <span>Opening Balance</span>
                <strong>
                  {formatCurrency(summary.openingBalance)}
                </strong>
              </div>

              <div className="footer-summary closing-summary">
                <span>Closing Balance</span>
                <strong>
                  {formatCurrency(summary.closingBalance)}
                </strong>
              </div>

            </div>
          </section>

          {/* STATEMENT FOOTER */}
          <footer className="app-footer">
            <span>
              © {new Date().getFullYear()} {SOCIETY.name}
            </span>

            <span>
              {SOCIETY.subtitle} · Reg. No. {SOCIETY.registrationNumber}
            </span>
          </footer>

        </div>
      </main>
    </div>
  );
}

/**
 * ACCOUNT FIELD COMPONENT
 * Renders editable customer account information fields.
 */
function AccountField({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="account-field">
      <label htmlFor={name}>{label}</label>

      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
      />
    </div>
  );
}

/**
 * SUMMARY CARD COMPONENT
 * Displays one financial metric with an icon and color scheme.
 */
function SummaryCard({ label, value, icon, color }) {
  return (
    <div className="summary-card">

      <div className="summary-card-content">
        <span className="summary-label">{label}</span>
        <strong className="summary-value">{value}</strong>
      </div>

      <div className={`summary-icon ${color}`}>
        {icon}
      </div>

    </div>
  );
}

/**
 * FORM FIELD COMPONENT
 * Maintains consistent labels and spacing across transaction inputs.
 */
function FormField({ label, children }) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export default App;
