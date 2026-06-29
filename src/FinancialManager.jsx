import React, { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'financial-manager-v2';
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function createMonthData() {
  return {
    income: 0,
    expenses: [],
    savings: [],
    debts: [],
    receivables: []
  };
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKey(key) {
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
}

function formatMonthLabel(key) {
  const { year, month } = parseMonthKey(key);
  return `${monthNames[month]} ${year}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function FinancialManager() {
  const [data, setData] = useState(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      const today = new Date();
      const key = getMonthKey(today);
      return {
        selectedMonth: key,
        selectedDate: `${key}-${String(today.getDate()).padStart(2, '0')}`,
        months: { [key]: createMonthData() }
      };
    }

    const parsed = JSON.parse(saved);
    if (!parsed.months) parsed.months = {};
    const today = new Date();
    const key = getMonthKey(today);
    if (!parsed.selectedMonth) parsed.selectedMonth = key;
    if (!parsed.selectedDate) parsed.selectedDate = `${key}-${String(today.getDate()).padStart(2, '0')}`;
    if (!parsed.months[parsed.selectedMonth]) parsed.months[parsed.selectedMonth] = createMonthData();
    return parsed;
  });

  const [incomeInput, setIncomeInput] = useState('');
  const [savingsPlace, setSavingsPlace] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [debtName, setDebtName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDate, setDebtDate] = useState('');
  const [receivableName, setReceivableName] = useState('');
  const [receivableAmount, setReceivableAmount] = useState('');
  const [receivableDate, setReceivableDate] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const monthData = useMemo(() => {
    if (!data.months[data.selectedMonth]) data.months[data.selectedMonth] = createMonthData();
    return data.months[data.selectedMonth];
  }, [data]);

  useEffect(() => {
    if (!data.selectedDate || !data.selectedDate.startsWith(data.selectedMonth)) {
      setData((prev) => ({ ...prev, selectedDate: `${prev.selectedMonth}-01` }));
    }
  }, [data.selectedMonth, data.selectedDate]);

  const income = monthData.income || 0;
  const expenses = monthData.expenses || [];
  const savings = monthData.savings || [];
  const debts = monthData.debts || [];
  const receivables = monthData.receivables || [];

  const expensesTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const savingsTotal = savings.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const balance = income - expensesTotal;

  const selectedDayExpenses = expenses.filter((item) => item.date === data.selectedDate);
  const monthExpensesByDay = useMemo(() => {
    const counts = {};
    expenses.forEach((item) => {
      const [year, month, day] = item.date.split('-').map(Number);
      const { year: currentYear, month: currentMonth } = parseMonthKey(data.selectedMonth);
      if (year === currentYear && month - 1 === currentMonth) {
        counts[day] = (counts[day] || 0) + 1;
      }
    });
    return counts;
  }, [expenses, data.selectedMonth]);

  const shiftMonth = (offset) => {
    const { year, month } = parseMonthKey(data.selectedMonth);
    const next = new Date(year, month + offset, 1);
    const nextKey = getMonthKey(next);
    setData((prev) => ({
      ...prev,
      selectedMonth: nextKey,
      selectedDate: `${nextKey}-01`,
      months: { ...prev.months, [nextKey]: prev.months[nextKey] || createMonthData() }
    }));
  };

  const handleIncomeSave = () => {
    const value = Number(incomeInput || 0);
    setData((prev) => ({
      ...prev,
      months: { ...prev.months, [prev.selectedMonth]: { ...prev.months[prev.selectedMonth], income: value } }
    }));
    setIncomeInput('');
  };

  const handleSavingsSave = () => {
    const place = savingsPlace.trim();
    const amount = Number(savingsAmount || 0);
    if (!place || !amount) return;
    setData((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          savings: [...(prev.months[prev.selectedMonth]?.savings || []), { id: Date.now().toString(), place, amount }]
        }
      }
    }));
    setSavingsPlace('');
    setSavingsAmount('');
  };

  const handleExpenseSave = () => {
    const title = expenseTitle.trim();
    const amount = Number(expenseAmount || 0);
    const date = expenseDate || data.selectedDate || `${data.selectedMonth}-01`;
    const note = expenseNote.trim();
    if (!title || !amount) return;
    setData((prev) => ({
      ...prev,
      selectedDate: date,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          expenses: [...(prev.months[prev.selectedMonth]?.expenses || []), { id: Date.now().toString(), title, amount, date, category: expenseCategory, note }]
        }
      }
    }));
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseNote('');
    setExpenseDate('');
  };

  const handleDebtSave = () => {
    const name = debtName.trim();
    const amount = Number(debtAmount || 0);
    const dueDate = debtDate;
    if (!name || !amount || !dueDate) return;
    setData((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          debts: [...(prev.months[prev.selectedMonth]?.debts || []), { id: Date.now().toString(), name, amount, dueDate }]
        }
      }
    }));
    setDebtName('');
    setDebtAmount('');
    setDebtDate('');
  };

  const handleReceivableSave = () => {
    const name = receivableName.trim();
    const amount = Number(receivableAmount || 0);
    const dueDate = receivableDate;
    if (!name || !amount || !dueDate) return;
    setData((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          receivables: [...(prev.months[prev.selectedMonth]?.receivables || []), { id: Date.now().toString(), name, amount, dueDate }]
        }
      }
    }));
    setReceivableName('');
    setReceivableAmount('');
    setReceivableDate('');
  };

  const removeSavings = (id) => {
    setData((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          savings: prev.months[prev.selectedMonth].savings.filter((item) => item.id !== id)
        }
      }
    }));
  };

  const removeExpense = (id) => {
    setData((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          expenses: prev.months[prev.selectedMonth].expenses.filter((item) => item.id !== id)
        }
      }
    }));
  };

  const removeDebt = (id) => {
    setData((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          debts: prev.months[prev.selectedMonth].debts.filter((item) => item.id !== id)
        }
      }
    }));
  };

  const removeReceivable = (id) => {
    setData((prev) => ({
      ...prev,
      months: {
        ...prev.months,
        [prev.selectedMonth]: {
          ...prev.months[prev.selectedMonth],
          receivables: prev.months[prev.selectedMonth].receivables.filter((item) => item.id !== id)
        }
      }
    }));
  };

  const renderCalendar = () => {
    const { year, month } = parseMonthKey(data.selectedMonth);
    const first = new Date(year, month, 1);
    const firstWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(<div key={`blank-${i}`} className="day-cell blank" />);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${data.selectedMonth}-${String(day).padStart(2, '0')}`;
      const count = monthExpensesByDay[day] || 0;
      cells.push(
        <div key={dateKey} className={`day-cell ${data.selectedDate === dateKey ? 'active' : ''}`} onClick={() => setData((prev) => ({ ...prev, selectedDate: dateKey }))}>
          <div className="date-number">{day}</div>
          {count ? <div className="expense-badge">{count}</div> : null}
        </div>
      );
    }
    while (cells.length % 7 !== 0) cells.push(<div key={`tail-${cells.length}`} className="day-cell blank" />);
    return cells;
  };

  return (
    <div className="app-shell">
      <style>{`
        :root { --bg:#f4f7fb; --card:#ffffff; --border:#dfe8f2; --text:#16212c; --muted:#6b7a8f; --accent:#1f6feb; --accent-2:#22c55e; --danger:#ef4444; --warning:#f59e0b; }
        *{box-sizing:border-box;} body{margin:0;font-family:Segoe UI, Roboto, Arial, sans-serif;background:linear-gradient(135deg,#eef4ff 0%,var(--bg) 100%);color:var(--text);} .app-shell{max-width:1200px;margin:0 auto;padding:24px 16px 40px;} .hero{background:linear-gradient(120deg,#164d9b 0%,#2f7cf1 100%);color:white;padding:22px 24px;border-radius:22px;box-shadow:0 18px 40px rgba(31,111,235,0.2);margin-bottom:20px;} .hero h1{margin:0 0 6px;font-size:28px;} .hero p{margin:0;opacity:0.95;} .topbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;} .month-nav{display:flex;align-items:center;gap:8px;flex-wrap:wrap;} .month-nav button,.btn,.chip-btn{border:none;border-radius:999px;padding:8px 12px;cursor:pointer;font-weight:600;} .month-nav button,.btn{background:rgba(255,255,255,0.2);color:white;} .month-nav input[type="month"]{border:none;border-radius:999px;padding:8px 12px;font-weight:600;background:white;color:var(--text);} .grid{display:grid;gap:16px;} .grid-2{grid-template-columns:repeat(2,minmax(0,1fr));} .summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px;} .card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:16px;box-shadow:0 8px 25px rgba(15,23,42,0.06);} .card h2,.card h3{margin:0 0 12px;font-size:18px;} .stat-label{font-size:13px;color:var(--muted);margin-bottom:4px;} .stat-value{font-size:22px;font-weight:700;} .form-row{display:grid;gap:10px;grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:10px;} .field{display:flex;flex-direction:column;gap:6px;} .field label{font-size:13px;font-weight:600;color:var(--muted);} .field input,.field select,.field textarea{border:1px solid var(--border);border-radius:12px;padding:10px 12px;font-size:14px;background:#fbfdff;} .field textarea{min-height:80px;resize:vertical;} .btn{background:var(--accent);color:white;padding:10px 14px;border-radius:12px;} .btn.secondary{background:#eaf2ff;color:var(--accent);} .btn.danger{background:#fee2e2;color:var(--danger);} .list{display:grid;gap:8px;margin-top:10px;} .list-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;background:#f8fbff;border:1px solid var(--border);border-radius:12px;} .list-item strong{display:block;} .list-item small{color:var(--muted);} .calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-top:10px;} .day-name{text-align:center;font-size:12px;color:var(--muted);font-weight:700;padding-bottom:4px;} .day-cell{min-height:72px;border:1px solid var(--border);border-radius:12px;padding:7px;background:#fcfeff;cursor:pointer;position:relative;} .day-cell.blank{background:#f7f9fc;cursor:default;} .day-cell.active{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent);} .day-cell .date-number{font-weight:700;} .day-cell .expense-badge{position:absolute;bottom:8px;right:8px;background:var(--accent);color:white;font-size:11px;padding:2px 6px;border-radius:999px;} .drop{display:flex;gap:8px;flex-wrap:wrap;} .pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#eef5ff;color:var(--accent);font-size:12px;} .muted{color:var(--muted);} @media (max-width:900px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.grid-2{grid-template-columns:1fr;}} @media (max-width:600px){.summary-grid{grid-template-columns:1fr;}.form-row{grid-template-columns:1fr;}}
      `}</style>

      <section className="hero">
        <h1>💰 Financial Manager</h1>
        <p>Track your income, expenses, savings, debts, and monthly plans in one place.</p>
        <div className="topbar">
          <div className="month-nav">
            <button type="button" onClick={() => shiftMonth(-1)}>◀ Previous</button>
            <input type="month" value={data.selectedMonth} onChange={(event) => {
              const nextMonth = event.target.value;
              setData((prev) => ({ ...prev, selectedMonth: nextMonth, selectedDate: `${nextMonth}-01`, months: { ...prev.months, [nextMonth]: prev.months[nextMonth] || createMonthData() } }));
            }} />
            <button type="button" onClick={() => shiftMonth(1)}>Next ▶</button>
          </div>
          <div className="muted">{formatMonthLabel(data.selectedMonth)}</div>
        </div>
      </section>

      <section className="summary-grid">
        <div className="card"><div className="stat-label">Monthly Income</div><div className="stat-value">{formatCurrency(income)}</div></div>
        <div className="card"><div className="stat-label">Total Expenses</div><div className="stat-value">{formatCurrency(expensesTotal)}</div></div>
        <div className="card"><div className="stat-label">Saved in Accounts</div><div className="stat-value">{formatCurrency(savingsTotal)}</div></div>
        <div className="card"><div className="stat-label">Remaining</div><div className="stat-value">{formatCurrency(balance)}</div></div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2>📥 Monthly Income</h2>
          <div className="field">
            <label htmlFor="incomeInput">Income for this month</label>
            <input id="incomeInput" type="number" min="0" step="0.01" placeholder="Enter income" value={incomeInput} onChange={(event) => setIncomeInput(event.target.value)} />
          </div>
          <button className="btn" type="button" onClick={handleIncomeSave}>Save Income</button>
        </div>

        <div className="card">
          <h2>🏦 Savings Tracker</h2>
          <div className="form-row">
            <div className="field">
              <label htmlFor="savingsPlace">Where it is stored</label>
              <input id="savingsPlace" type="text" placeholder="Bank X / Office" value={savingsPlace} onChange={(event) => setSavingsPlace(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="savingsAmount">Amount</label>
              <input id="savingsAmount" type="number" min="0" step="0.01" placeholder="0" value={savingsAmount} onChange={(event) => setSavingsAmount(event.target.value)} />
            </div>
          </div>
          <button className="btn" type="button" onClick={handleSavingsSave}>Add Savings</button>
          <div className="list">{savings.length ? savings.map((item) => (
            <div key={item.id} className="list-item">
              <div><strong>{item.place}</strong><small>{formatCurrency(item.amount)}</small></div>
              <button className="btn danger" type="button" onClick={() => removeSavings(item.id)}>Remove</button>
            </div>
          )) : <div className="muted">No savings entries yet.</div>}</div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2>💸 Expenses</h2>
          <div className="form-row">
            <div className="field">
              <label htmlFor="expenseDate">Date</label>
              <input id="expenseDate" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="expenseCategory">Category</label>
              <select id="expenseCategory" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)}>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Utilities">Utilities</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health</option>
                <option value="Shopping">Shopping</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="expenseTitle">What was it for?</label>
              <input id="expenseTitle" type="text" placeholder="Groceries, bills, rent..." value={expenseTitle} onChange={(event) => setExpenseTitle(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="expenseAmount">Amount</label>
              <input id="expenseAmount" type="number" min="0" step="0.01" placeholder="0" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} />
            </div>
          </div>
          {expenseCategory === 'Others' && (
            <div className="field">
              <label htmlFor="expenseNote">Explain this expense</label>
              <textarea id="expenseNote" placeholder="Describe the other expense" value={expenseNote} onChange={(event) => setExpenseNote(event.target.value)} />
            </div>
          )}
          <button className="btn" type="button" onClick={handleExpenseSave}>Add Expense</button>
          <div className="list">{expenses.length ? expenses.map((item) => (
            <div key={item.id} className="list-item">
              <div><strong>{item.title}</strong><small>{item.date} • {item.category}{item.note ? ` • ${item.note}` : ''}</small></div>
              <div className="drop"><span className="pill">{formatCurrency(item.amount)}</span><button className="btn danger" type="button" onClick={() => removeExpense(item.id)}>Remove</button></div>
            </div>
          )) : <div className="muted">No expenses recorded yet.</div>}</div>
        </div>

        <div className="card">
          <h2>📅 Calendar</h2>
          <div className="calendar-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((name) => <div key={name} className="day-name">{name}</div>)}{renderCalendar()}</div>
          <div className="card" style={{ marginTop: 12 }}>
            <h3>Selected Day • {data.selectedDate}</h3>
            <div className="list">{selectedDayExpenses.length ? selectedDayExpenses.map((item) => (
              <div key={item.id} className="list-item">
                <div><strong>{item.title}</strong><small>{item.category}{item.note ? ` • ${item.note}` : ''}</small></div>
                <span className="pill">{formatCurrency(item.amount)}</span>
              </div>
            )) : <div className="muted">No expenses for this day.</div>}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <h2>💳 Money I Owe</h2>
          <div className="form-row">
            <div className="field"><label htmlFor="debtName">Name</label><input id="debtName" type="text" placeholder="Person or company" value={debtName} onChange={(event) => setDebtName(event.target.value)} /></div>
            <div className="field"><label htmlFor="debtAmount">Amount</label><input id="debtAmount" type="number" min="0" step="0.01" placeholder="0" value={debtAmount} onChange={(event) => setDebtAmount(event.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="debtDate">Expected date to pay back</label><input id="debtDate" type="date" value={debtDate} onChange={(event) => setDebtDate(event.target.value)} /></div>
          <button className="btn secondary" type="button" onClick={handleDebtSave}>Add Debt</button>
          <div className="list">{debts.length ? debts.map((item) => (
            <div key={item.id} className="list-item">
              <div><strong>{item.name}</strong><small>Pay by {item.dueDate}</small></div>
              <div className="drop"><span className="pill">{formatCurrency(item.amount)}</span><button className="btn danger" type="button" onClick={() => removeDebt(item.id)}>Remove</button></div>
            </div>
          )) : <div className="muted">No debts recorded yet.</div>}</div>
        </div>

        <div className="card">
          <h2>💵 Money People Owe Me</h2>
          <div className="form-row">
            <div className="field"><label htmlFor="receivableName">Name</label><input id="receivableName" type="text" placeholder="Person" value={receivableName} onChange={(event) => setReceivableName(event.target.value)} /></div>
            <div className="field"><label htmlFor="receivableAmount">Amount</label><input id="receivableAmount" type="number" min="0" step="0.01" placeholder="0" value={receivableAmount} onChange={(event) => setReceivableAmount(event.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="receivableDate">Expected date</label><input id="receivableDate" type="date" value={receivableDate} onChange={(event) => setReceivableDate(event.target.value)} /></div>
          <button className="btn secondary" type="button" onClick={handleReceivableSave}>Add Receivable</button>
          <div className="list">{receivables.length ? receivables.map((item) => (
            <div key={item.id} className="list-item">
              <div><strong>{item.name}</strong><small>Expected {item.dueDate}</small></div>
              <div className="drop"><span className="pill">{formatCurrency(item.amount)}</span><button className="btn danger" type="button" onClick={() => removeReceivable(item.id)}>Remove</button></div>
            </div>
          )) : <div className="muted">No receivables recorded yet.</div>}</div>
        </div>
      </section>
    </div>
  );
}
