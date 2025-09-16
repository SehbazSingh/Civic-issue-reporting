import React from 'react';
import ReactDOM from 'react-dom/client';
import IssueMap from './IssueMap';
import './styles.css';



function Dashboard() {
  // Login state
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [loginData, setLoginData] = React.useState({ gmail: '', password: '', state: '', department: '' });
  const [user, setUser] = React.useState(null); // { gmail, state, department }

  // Dashboard state
  const [issues, setIssues] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all');
  const [updating, setUpdating] = React.useState(null);
  const [updateStatusMsg, setUpdateStatusMsg] = React.useState("");

  React.useEffect(() => {
    if (loggedIn) fetchIssues();
  }, [loggedIn]);

  function fetchIssues() {
    setLoading(true);
    fetch('http://localhost:4000/api/issues')
      .then(res => res.json())
      .then(data => {
        setIssues(data.reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function updateStatus(id, status) {
    setUpdating(id);
    setUpdateStatusMsg("");
    try {
      const res = await fetch(`http://localhost:4000/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setUpdateStatusMsg("Status updated successfully!");
        fetchIssues();
      } else {
        setUpdateStatusMsg("Failed to update status.");
      }
    } catch {
      setUpdateStatusMsg("Failed to update status.");
    }
    setUpdating(null);
  }
  // Priority summary for dashboard
  const visibleForUser = React.useMemo(() => {
    if (!user) return issues;
    return issues.filter(issue => {
      if (user.department && issue.department && issue.department.toLowerCase() !== user.department.toLowerCase()) return false;
      if (user.department && !issue.department) return false;
      if (user.state && issue.state && issue.state !== user.state) return false;
      return true;
    });
  }, [issues, user]);

  const prioritySummary = React.useMemo(() => {
    const urgent = visibleForUser.filter(i => i.status === 'not solved').length;
    const underwork = visibleForUser.filter(i => i.status === 'underwork').length;
    const solved = visibleForUser.filter(i => i.status === 'solved').length;
    return { urgent, underwork, solved };
  }, [visibleForUser]);

  // Status filter logic (category/state removed)
  const statusOptions = ['not solved', 'underwork', 'solved'];
  const filteredIssues = visibleForUser.filter(issue => {
    // After login, only show issues matching the selected department (case-insensitive, skip if missing)
    if (user) {
      if (user.department && issue.department && issue.department.toLowerCase() !== user.department.toLowerCase()) return false;
      if (user.department && !issue.department) return false;
      if (user.state && issue.state && issue.state !== user.state) return false;
    }
    if (filter !== 'all' && issue.status !== filter) return false;
    return true;
  });

  return (
    <div>
      {!loggedIn ? (
        <div className="login-shell fade-in">
          <div className="login-panel">
            <h2>Authority Login</h2>
            <form onSubmit={e => {
              e.preventDefault();
              setUser({
                gmail: loginData.gmail,
                state: loginData.state,
                department: loginData.department
              });
              setLoggedIn(true);
            }}>
              <div className="form-group">
                <label>Gmail</label>
                <input type="email" required value={loginData.gmail} onChange={e => setLoginData({ ...loginData, gmail: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" required value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
              </div>
              <div className="form-group">
                <label>State</label>
                <select required value={loginData.state} onChange={e => setLoginData({ ...loginData, state: e.target.value })}>
                  <option value="">Select State</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <select required value={loginData.department} onChange={e => setLoginData({ ...loginData, department: e.target.value })}>
                  <option value="">Select Department</option>
                  <option value="PWD">PWD</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="Water">Water</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button type="submit" className="login-btn">Login</button>
              {/* Demo login: any email & password will work. There is no backend authentication yet. */}
              <div style={{color:'#94a3b8', fontSize:13, marginTop:10, textAlign:'center'}}>
                <b>Demo:</b> Use any email and password to login.<br/>
                Department and state will filter the issues shown.
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="dashboard-shell fade-in">
          <div className="header-bar">
            <h1 className="header-title">Authority Dashboard</h1>
          </div>

          <div className="panel issue-map-wrapper fade-in">
            <h2>Live City Issue Map</h2>
            <IssueMap issues={visibleForUser} />
            <div className="priority-summary">
              <div className="priority-pill danger"><span className="priority-number">{prioritySummary.urgent}</span><span>Urgent</span></div>
              <div className="priority-pill warn"><span className="priority-number">{prioritySummary.underwork}</span><span>Underwork</span></div>
              <div className="priority-pill success"><span className="priority-number">{prioritySummary.solved}</span><span>Solved</span></div>
              <div className="priority-pill info"><span className="priority-number">{visibleForUser.length}</span><span>Total</span></div>
            </div>
            <div className="legend-note">Red = urgent, Orange = underwork, Green = solved. Zoom / pan for details. Hover circles.</div>
          </div>

          <div className="panel fade-in" style={{ marginTop: 28 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--primary-accent)', marginBottom: 18 }}>Filters</h2>
            <div className="filters-grid">
              <div className="filter-block">
                <label>Status</label>
                <select value={filter} onChange={e => setFilter(e.target.value)}>
                  <option value="all">All</option>
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              
            </div>
          </div>

          <div className="panel fade-in" style={{ marginTop: 30 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--primary-accent)', marginBottom: 18 }}>Issues</h2>
            {updateStatusMsg && <p style={{ color: updateStatusMsg.includes('success') ? 'var(--success)' : 'var(--danger)', marginBottom: 14, fontSize: 13 }}>{updateStatusMsg}</p>}
            {loading ? (
              <div className="empty">Loading...</div>
            ) : filteredIssues.length === 0 ? (
              <div className="empty">No issues reported yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="issues-table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>ID</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Photo</th>
                      <th>Set Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map(issue => {
                      const statusClass = `status-badge ${issue.status.replace(' ', '')}`;
                      const priorityClass = issue.status === 'not solved' ? 'danger' : issue.status === 'underwork' ? 'warn' : issue.status === 'solved' ? 'success' : 'info';
                      return (
                        <tr key={issue._id || issue.id}>
                          <td><span className={`priority-dot ${priorityClass}`}></span></td>
                          <td><span className="id-code">{issue._id || issue.id}</span></td>
                          <td style={{ fontWeight:500 }}>{issue.category || '—'}</td>
                          <td style={{ maxWidth: 260, whiteSpace: 'pre-wrap' }}>{issue.description}</td>
                          <td style={{ fontSize:12 }}>{issue.location}</td>
                          <td><span className={statusClass}>{issue.status}</span></td>
                          <td style={{ fontSize:12 }}>{new Date(issue.createdAt).toLocaleString()}</td>
                          <td>
                            {issue.photoUrl ? (
                              <img className="photo-thumb" src={`http://localhost:4000${issue.photoUrl}`} alt="Issue" />
                            ) : <span style={{ color:'var(--text-dim)', fontSize:12 }}>—</span>}
                          </td>
                          <td>
                            <select
                              className="action-select"
                              value={issue.status}
                              onChange={e => updateStatus(issue._id || issue.id, e.target.value)}
                              disabled={updating === (issue._id || issue.id)}
                            >
                              {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="footer-note">Civic Issue Management • v0.1 prototype</div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);
