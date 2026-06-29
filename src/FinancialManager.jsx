import React, { useState, useEffect } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

/**
 * Financial Stability Manager
 *
 * A complete financial tracking app that helps you:
 * - Track monthly income
 * - Monitor expenses by category
 * - Visualize spending with charts
 * - Manage financial tasks by priority
 * - Calculate savings and financial health
 *
 * Data is automatically saved to browser's localStorage
 */
export default function FinancialManager() {
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newExpense, setNewExpense] = useState({ name: '', amount: '', category: 'Food' });
  const [newTask, setNewTask] = useState({ name: '', priority: 'not-emergency' });
  const [incomeInput, setIncomeInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('financialData');
    if (saved) {
      const data = JSON.parse(saved);
      setMonthlyIncome(data.monthlyIncome || 0);
      setExpenses(data.expenses || []);
      setTasks(data.tasks || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('financialData', JSON.stringify({
      monthlyIncome,
      expenses,
      tasks
    }));
  }, [monthlyIncome, expenses, tasks]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const savings = monthlyIncome - totalExpenses;
  const savingsPercentage = monthlyIncome > 0 ? Math.round((savings / monthlyIncome) * 100) : 0;

  const expensesByCategory = {};
  expenses.forEach(exp => {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + parseFloat(exp.amount);
  });

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value: Math.round(value * 100) / 100
  }));

  const barData = [
    { name: 'Income', value: Math.round(monthlyIncome * 100) / 100 },
    { name: 'Expenses', value: Math.round(totalExpenses * 100) / 100 },
    { name: 'Savings', value: Math.round(savings * 100) / 100 }
  ];

  const colors = ['#185FA5', '#993C1D', '#3B6D11'];

  const handleAddExpense = () => {
    if (newExpense.name && newExpense.amount) {
      setExpenses([...expenses, { ...newExpense, id: Date.now() }]);
      setNewExpense({ name: '', amount: '', category: 'Food' });
    }
  };

  const handleRemoveExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const handleSetIncome = () => {
    if (incomeInput) {
      setMonthlyIncome(parseFloat(incomeInput));
      setIncomeInput('');
    }
  };

  const handleAddTask = () => {
    if (newTask.name) {
      setTasks([...tasks, { ...newTask, id: Date.now(), completed: false }]);
      setNewTask({ name: '', priority: 'not-emergency' });
    }
  };

  const handleToggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleRemoveTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const emergencyTasks = tasks.filter(t => t.priority === 'emergency');
  const normalTasks = tasks.filter(t => t.priority === 'not-emergency');
  const laterTasks = tasks.filter(t => t.priority === 'later');

  return (
    <div style={{ padding: '2rem', background: 'var(--surface-0)', minHeight: '100vh' }}>
      <style>{`
        .card { background: var(--surface-2); border: 0.5px solid var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
        .metric-card { background: var(--surface-1); border-radius: var(--radius); padding: 1rem; text-align: center; }
        .metric-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
        .metric-value { font-size: 24px; font-weight: 500; color: var(--text-primary); }
        .input-group { display: flex; gap: 8px; margin-bottom: 1rem; }
        .input-group input, .input-group select { flex: 1; padding: 8px 12px; border: 0.5px solid var(--border); border-radius: var(--radius); font-size: 14px; }
        .btn { padding: 8px 16px; border: 0.5px solid var(--border-strong); border-radius: var(--radius); background: var(--surface-2); cursor: pointer; font-size: 14px; color: var(--text-primary); transition: all 0.2s; }
        .btn:hover { background: var(--surface-1); }
        .btn-danger { border-color: var(--border-danger); color: var(--text-danger); }
        .btn-danger:hover { background: var(--bg-danger); }
        .expense-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 0.5px solid var(--border); }
        .task-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 0.5px solid var(--border); }
        .task-item input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
        .task-item.completed { opacity: 0.6; }
        .task-item.completed span { text-decoration: line-through; }
        .chart-container { margin: 1.5rem 0; }
        .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 1.5rem; }
        .h2 { font-size: 18px; font-weight: 500; margin: 1.5rem 0 1rem 0; color: var(--text-primary); }
      `}</style>

      <h1 style={{ fontSize: '24px', fontWeight: 500, marginBottom: '2rem', color: 'var(--text-primary)' }}>
        💰 Financial Stability Manager
      </h1>

      <div className="grid-2">
        <div className="metric-card">
          <div className="metric-label">Monthly Income</div>
          <div className="metric-value" style={{ color: '#185FA5' }}>₹{Math.round(monthlyIncome * 100) / 100}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Expenses</div>
          <div className="metric-value" style={{ color: '#993C1D' }}>₹{Math.round(totalExpenses * 100) / 100}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Savings</div>
          <div className="metric-value" style={{ color: savings >= 0 ? '#3B6D11' : '#A32D2D' }}>₹{Math.round(savings * 100) / 100}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Savings %</div>
          <div className="metric-value" style={{ color: savingsPercentage >= 20 ? '#3B6D11' : '#993C1D' }}>{savingsPercentage}%</div>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">📊 Income</h2>
        <div className="input-group">
          <input type="number" placeholder="Enter monthly income" value={incomeInput} onChange={(e) => setIncomeInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSetIncome()} />
          <button className="btn" onClick={handleSetIncome}>Set Income</button>
        </div>
      </div>

      {pieData.length > 0 && (
        <div className="card">
          <h2 className="h2">📈 Expense Breakdown by Category</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ₹${value}`} outerRadius={80} fill="#185FA5" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Math.round(value * 100) / 100}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {monthlyIncome > 0 && (
        <div className="card">
          <h2 className="h2">📊 Income vs Expenses vs Savings</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="value" fill="#185FA5">
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="h2">💸 Track Your Expenses</h2>
        <div className="input-group">
          <input type="text" placeholder="What did you spend on?" value={newExpense.name} onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })} />
          <input type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
          <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
            <option>Food</option>
            <option>Transport</option>
            <option>Utilities</option>
            <option>Entertainment</option>
            <option>Health</option>
            <option>Shopping</option>
            <option>Other</option>
          </select>
          <button className="btn" onClick={handleAddExpense}>Add</button>
        </div>

        {expenses.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No expenses yet. Start tracking your spending!</p>
        ) : (
          <div>
            {expenses.map(exp => (
              <div key={exp.id} className="expense-item">
                <div>
                  <strong>{exp.name}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px', marginLeft: '8px' }}>({exp.category})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 500 }}>₹{Math.round(parseFloat(exp.amount) * 100) / 100}</span>
                  <button className="btn btn-danger" onClick={() => handleRemoveExpense(exp.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="h2">✅ Action Items & Financial Goals</h2>
        <div className="input-group">
          <input type="text" placeholder="Add a financial goal or task..." value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} />
          <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
            <option value="emergency">🚨 Emergency</option>
            <option value="not-emergency">⚡ Not Emergency</option>
            <option value="later">📅 Can be done later</option>
          </select>
          <button className="btn" onClick={handleAddTask}>Add Task</button>
        </div>

        {emergencyTasks.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-danger)', marginBottom: '8px' }}>🚨 Emergency - Must do now</h3>
            {emergencyTasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} />
                <span style={{ flex: 1 }}>{task.name}</span>
                <button className="btn btn-danger" onClick={() => handleRemoveTask(task.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {normalTasks.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-warning)', marginBottom: '8px' }}>⚡ Not Emergency - Should do soon</h3>
            {normalTasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} />
                <span style={{ flex: 1 }}>{task.name}</span>
                <button className="btn btn-danger" onClick={() => handleRemoveTask(task.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {laterTasks.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-accent)', marginBottom: '8px' }}>📅 Can be done later - When time permits</h3>
            {laterTasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} />
                <span style={{ flex: 1 }}>{task.name}</span>
                <button className="btn btn-danger" onClick={() => handleRemoveTask(task.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        {tasks.length === 0 && (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No tasks yet. Add one to organize your financial goals!</p>
        )}
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2rem' }}>
        <p>Your data is saved automatically in your browser. Financial stability is built one step at a time! 🚀</p>
      </div>
    </div>
  );
}
