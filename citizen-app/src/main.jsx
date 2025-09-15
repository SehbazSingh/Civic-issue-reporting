import React from 'react';
import { MapContainer, TileLayer, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ReactDOM from 'react-dom/client';
import './styles.css';




function App() {
  // Dynamic API base (supports mobile access on LAN)
  const API_BASE = React.useMemo(() => {
    const envBase = import.meta.env.VITE_API_BASE;
    if (envBase) return envBase.replace(/\/$/, '');
    const host = window.location.hostname;
    // If running on localhost use localhost, else reuse current host (likely LAN IP) with backend port 4000
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:4000';
    return `http://${host}:4000`;
  }, []);
  // Voice input state
  const [voiceEnabled, setVoiceEnabled] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef(null);

  // Initialize SpeechRecognition if available
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => prev ? prev + ' ' + transcript : transcript);
        setListening(false);
      };
      recognitionRef.current.onerror = () => setListening(false);
      recognitionRef.current.onend = () => setListening(false);
    }
  }, []);

  function handleVoiceToggle() {
    setVoiceEnabled(v => {
      if (v && listening && recognitionRef.current) {
        recognitionRef.current.stop();
        setListening(false);
      }
      return !v;
    });
    // Optionally clear description when toggling on
    if (!voiceEnabled) setDescription("");
  }

  function handleStartListening() {
    if (recognitionRef.current && !listening) {
      setListening(true);
      recognitionRef.current.start();
    }
  }

  function handleStopListening() {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }
  const [description, setDescription] = React.useState("");
  const [state, setState] = React.useState("");
  const [city, setCity] = React.useState("");
  const country = "India";
  const [email, setEmail] = React.useState("");
  const [category, setCategory] = React.useState("");
  // Map categories to departments
  const categoryToDepartment = {
    pothole: "PWD",
    streetlight: "Electricity",
    trash: "Sanitation",
    water: "Water",
    other: "Other"
  };
  const categoryOptions = [
    { value: "pothole", label: "Pothole (PWD)" },
    { value: "streetlight", label: "Streetlight (Electricity)" },
    { value: "trash", label: "Trash (Sanitation)" },
    { value: "water", label: "Water (Water)" },
    { value: "other", label: "Other (Other)" }
  ];
  const [department, setDepartment] = React.useState("");
  const [photo, setPhoto] = React.useState(null);
  const [location, setLocation] = React.useState("");
  const [autoLocating, setAutoLocating] = React.useState(false);
  const [status, setStatus] = React.useState("");
    const [submittedId, setSubmittedId] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [issues, setIssues] = React.useState([]);
  const [checkId, setCheckId] = React.useState("");
  const [checkedIssue, setCheckedIssue] = React.useState(null);
  const [checking, setChecking] = React.useState(false);
  // Feedback/resubmission state for solved issues in Check tab
  const [feedback, setFeedback] = React.useState(null); // 'satisfied' | 'unsatisfied'
  const [resubmitting, setResubmitting] = React.useState(false);
  const [resubmitMsg, setResubmitMsg] = React.useState("");
  const [resubmittedId, setResubmittedId] = React.useState(null);

  // Fetch issues from backend

  React.useEffect(() => {
    fetchIssues();
  }, []);

  async function fetchIssues() {
    try {
  const res = await fetch(`${API_BASE}/api/issues`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data.reverse()); // Show newest first
      }
    } catch {}
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
  const formData = new FormData();
  formData.append("description", description);
  formData.append("location", location);
  formData.append("category", category);
  formData.append("department", department);
  formData.append("email", email);
  formData.append("state", state);
  formData.append("city", city);
  formData.append("country", country);
  if (photo) formData.append("photo", photo);

    try {
  const res = await fetch(`${API_BASE}/api/report`, {
        method: "POST",
        body: formData,
      });
        const data = await res.json();
        if (data.issueId) {
          setStatus("Issue submitted successfully!");
          setSubmittedId(data.issueId);
          setDescription("");
          setPhoto(null);
          setLocation("");
          fetchIssues();
        } else {
          setStatus("Failed to submit issue.");
          setSubmittedId(null);
        }
    } catch (err) {
      setStatus("Error submitting issue.");
    }
    setLoading(false);
  }

  async function handleCheckIssue(e) {
    e.preventDefault();
    setChecking(true);
    setCheckedIssue(null);
    try {
  const res = await fetch(`${API_BASE}/api/issues`);
      if (res.ok) {
        const data = await res.json();
  const found = data.find(i => i._id === checkId.trim());
        setCheckedIssue(found || { error: 'No issue found with this ID.' });
      } else {
        setCheckedIssue({ error: 'Error fetching issues.' });
      }
    } catch {
      setCheckedIssue({ error: 'Network error.' });
    }
    setChecking(false);
  }

  async function handleResubmitFromSolved() {
    if (!checkedIssue) return;
    setResubmitMsg("");
    setResubmitting(true);
    try {
      const fd = new FormData();
      const deptGuess = (checkedIssue.department || categoryToDepartment[checkedIssue.category] || "");
      fd.append("description", `${checkedIssue.description} (Resubmitted from ${checkedIssue._id})`);
      fd.append("location", checkedIssue.location || "");
      fd.append("category", checkedIssue.category || "other");
      if (deptGuess) fd.append("department", deptGuess);
      if (checkedIssue.email) fd.append("email", checkedIssue.email);
      if (checkedIssue.state) fd.append("state", checkedIssue.state);
      if (checkedIssue.city) fd.append("city", checkedIssue.city);
      fd.append("country", checkedIssue.country || "India");

      const res = await fetch(`${API_BASE}/api/report`, { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.issueId) {
        setResubmitMsg("Resubmitted. New Issue ID copied to clipboard.");
        setResubmittedId(data.issueId);
        try { await navigator.clipboard?.writeText(data.issueId); } catch {}
      } else {
        setResubmitMsg(data?.error || "Failed to resubmit issue.");
      }
    } catch (e) {
      setResubmitMsg("Network error while resubmitting.");
    }
    setResubmitting(false);
  }

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setAutoLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
        setLocation(coords);
        setAutoLocating(false);
      },
      err => {
        alert('Unable to retrieve your location.');
        setAutoLocating(false);
      }
    );
  }

  // Helper: extract coordinates from issue.location ("lat, lng")
  function getLatLng(loc) {
    if (!loc) return null;
    const parts = loc.split(',').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return { lat: parts[0], lng: parts[1] };
  }

  return (
    <div>
      <header className="app-header">
        <div className="logo-icon" aria-hidden>🛠️</div>
        <h1 className="app-title">Civic Issue Tracker</h1>
      </header>
      <div style={{ background: '#23242a', borderRadius: 20, boxShadow: '0 4px 16px #0003', padding: 24, margin: '24px 24px 12px 24px', border: '1px solid #333', transition: 'box-shadow 0.3s, border-radius 0.3s' }}>
        <h2 style={{ color: '#90caf9', fontSize: 18, marginBottom: 8, textAlign: 'center', fontWeight: 600 }}>Check Issue Status</h2>
        <form onSubmit={handleCheckIssue} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={checkId}
            onChange={e => setCheckId(e.target.value)}
            placeholder="Enter your Issue ID"
            style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181a20', color: '#e0e0e0' }}
            required
          />
          <button type="submit" disabled={checking} style={{ background: '#1976d2', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: checking ? 'not-allowed' : 'pointer' }}>
            {checking ? 'Checking...' : 'Check'}
          </button>
        </form>
        {checkedIssue && (
          checkedIssue.error ? (
            <p style={{ color: '#f44336', textAlign: 'center' }}>{checkedIssue.error}</p>
          ) : (
            <div style={{ marginTop: 8, textAlign: 'center', color: '#e0e0e0' }}>
              <div><strong>ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{checkedIssue._id}</span></div>
              <div><strong>Description:</strong> {checkedIssue.description}</div>
              <div><strong>Category:</strong> {checkedIssue.category || '—'}</div>
              <div><strong>Location:</strong> {checkedIssue.location}</div>
              <div><strong>Status:</strong> <span style={{ color: checkedIssue.status === 'solved' ? '#4caf50' : checkedIssue.status === 'underwork' ? '#ff9800' : checkedIssue.status === 'not solved' ? '#f44336' : '#90caf9' }}>{checkedIssue.status}</span></div>
              <div><strong>Date:</strong> {new Date(checkedIssue.createdAt).toLocaleString()}</div>
              {checkedIssue.photoUrl && (
                <div style={{ marginTop: 8 }}>
                  <img src={`${API_BASE}${checkedIssue.photoUrl}`} alt="Issue" style={{ maxWidth: '100%', borderRadius: 6 }} />
                </div>
              )}
              {checkedIssue.status === 'solved' && (
                <div className="feedback-box">
                  <div className="feedback-title">Are you satisfied with the resolution?</div>
                  <div className="segmented">
                    <button
                      type="button"
                      onClick={() => { setFeedback('satisfied'); setResubmitMsg('Thanks for your feedback!'); }}
                      className="seg-option ok"
                    >😊 Satisfied</button>
                    <button
                      type="button"
                      onClick={() => { setFeedback('unsatisfied'); handleResubmitFromSolved(); }}
                      disabled={resubmitting}
                      className="seg-option no"
                      style={{ opacity: resubmitting ? .7 : 1 }}
                    >{resubmitting ? '⏳ Resubmitting…' : '😕 Not satisfied'}</button>
                  </div>
                  {(resubmitMsg || resubmittedId) && (
                    <div className="feedback-msg">
                      {resubmitMsg && <div>{resubmitMsg}</div>}
                      {resubmittedId && (
                        <div>New Issue ID: <span className="feedback-id">{resubmittedId}</span></div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
      <div style={{ padding: '32px 24px 24px 24px', margin: '0 24px', background: '#23242a', borderRadius: 20, boxShadow: '0 4px 16px #0003', border: '1px solid #333', transition: 'box-shadow 0.3s, border-radius 0.3s' }}>
        <h2 style={{ color:'#90caf9', fontSize:22, margin:'0 0 18px', textAlign:'center', fontWeight:700, letterSpacing:.5 }}>Report Issue</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, background: '#23242a', borderRadius: 16, boxShadow: '0 4px 16px #0003', padding: 20, border: '1px solid #333', transition: 'box-shadow 0.3s, border-radius 0.3s' }}>
          <div>
            <label style={{ fontWeight: "bold", color: '#90caf9' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #444", marginTop: 4, background: '#181a20', color: '#e0e0e0' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: '#90caf9' }}>State</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              required
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #444", marginTop: 4, background: '#181a20', color: '#e0e0e0' }}
            >
              <option value="">Select state</option>
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
          <div>
            <label style={{ fontWeight: "bold", color: '#90caf9' }}>City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              required
              placeholder="Enter your city"
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #444", marginTop: 4, background: '#181a20', color: '#e0e0e0' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: '#90caf9' }}>Category</label>
            <select value={category} onChange={e => {
              setCategory(e.target.value);
              setDepartment(categoryToDepartment[e.target.value] || "");
            }} required style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #444", marginTop: 4, background: '#181a20', color: '#e0e0e0' }}>
              <option value="">Select category</option>
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: '#90caf9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={voiceEnabled} onChange={handleVoiceToggle} style={{ marginRight: 6, accentColor: '#1976d2', width: 18, height: 18 }} />
              <span style={{ fontSize: 17 }}>Use Voice to Describe Issue</span>
            </label>
            {/* Show textarea if not using voice */}
            {!voiceEnabled && (
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={3}
                style={{ width: "100%", padding: 10, borderRadius: 10, border: "1.5px solid #1976d2", marginTop: 10, background: '#181a20', color: '#e0e0e0', fontSize: 16, boxShadow: '0 2px 8px #1976d220' }}
                placeholder="Describe the issue..."
              />
            )}
            {/* Show voice controls if toggled */}
            {voiceEnabled && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#23242a', borderRadius: 12, border: '1.5px solid #1976d2', padding: 18, boxShadow: '0 2px 12px #1976d220', minHeight: 90, position: 'relative' }}>
                <div style={{ fontSize: 15, color: '#90caf9', marginBottom: 8, fontWeight: 500 }}>Voice Description</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={handleStartListening}
                    disabled={listening || !(window.SpeechRecognition || window.webkitSpeechRecognition)}
                    style={{ background: listening ? '#bdbdbd' : '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 'bold', fontSize: 16, cursor: listening ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px #1976d220', transition: 'background 0.2s' }}
                    title={!(window.SpeechRecognition || window.webkitSpeechRecognition) ? 'Voice input not supported in this browser' : listening ? 'Listening...' : 'Start voice input'}
                  >
                    🎤 Speak
                  </button>
                  <button
                    type="button"
                    onClick={handleStopListening}
                    disabled={!listening}
                    style={{ background: !listening ? '#bdbdbd' : '#f44336', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 'bold', fontSize: 16, cursor: !listening ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px #f4433620', transition: 'background 0.2s' }}
                  >
                    ⏹ Stop
                  </button>
                </div>
                <div style={{ marginTop: 16, width: '100%', minHeight: 32, background: '#181a20', borderRadius: 8, border: '1px solid #333', color: '#e0e0e0', fontSize: 15, padding: 10, textAlign: 'left', boxShadow: '0 1px 4px #1976d210' }}>
                  {description ? description : (listening ? <span style={{ color: '#ff9800' }}>Listening... Speak now.</span> : <span style={{ color: '#bdbdbd' }}>Your spoken description will appear here.</span>)}
                </div>
                {!(window.SpeechRecognition || window.webkitSpeechRecognition) && (
                  <div style={{ color: '#f44336', fontSize: 13, marginTop: 8 }}>Voice input not supported in this browser.</div>
                )}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: '#90caf9' }}>Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setPhoto(e.target.files[0])}
              style={{
                marginTop: 4,
                color: '#e0e0e0',
                background: '#23242a',
                border: 'none',
                borderRadius: 6,
                padding: '8px 0',
                fontSize: 15,
                boxShadow: '0 1px 4px #0002',
                cursor: 'pointer',
                width: '100%',
              }}
            />
          </div>
          <div>
            <label style={{ fontWeight: "bold", color: '#90caf9' }}>Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="Enter location or address" style={{ width: '100%', padding: 8, borderRadius: 6, border: "1px solid #444", marginTop: 4, background: '#181a20', color: '#e0e0e0' }} />
            <button type="button" onClick={handleDetectLocation} disabled={autoLocating} style={{ background: '#1976d2', color: '#fff', padding: '8px 12px', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: autoLocating ? 'not-allowed' : 'pointer', marginTop: 10, width: '100%' }}>
              {autoLocating ? 'Detecting...' : 'Auto Detect'}
            </button>
            {/* Show map if location is coordinates */}
            {/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?((1[0-7]\d)|(\d{1,2}))(\.\d+)?|180(\.0+)?$/.test(location) && (
              (() => {
                const [lat, lng] = location.split(',').map(Number);
                if (isNaN(lat) || isNaN(lng)) return null;
                const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
                return (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <iframe
                      title="Detected Location"
                      width="100%"
                      height="220"
                      frameBorder="0"
                      style={{ borderRadius: 8, border: '1px solid #333' }}
                      src={mapUrl}
                      allowFullScreen
                    ></iframe>
                    <div style={{ fontSize: 13, color: '#bdbdbd', marginTop: 4 }}>
                      Map preview (OpenStreetMap)
                    </div>
                  </div>
                );
              })()
            )}
          </div>
          <button type="submit" disabled={loading} style={{ background: "#1976d2", color: "#fff", padding: "10px 0", border: "none", borderRadius: 6, fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer", boxShadow: '0 2px 8px #0002' }}>
            {loading ? "Submitting..." : "Submit Issue"}
          </button>
        </form>
        {status && <p style={{ color: status.includes("success") ? "#4caf50" : "#f44336", textAlign: "center", marginTop: 16 }}>{status}</p>}
          {submittedId && (
            <p style={{ color: '#90caf9', textAlign: 'center', marginTop: 8 }}>
              <strong>Your Issue ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: 15 }}>{submittedId}</span><br />
              Save this ID to check your issue status later.
            </p>
          )}
      </div>

  {/* Heat map of issues */}
  <div style={{ margin: '32px 0 24px 0', padding: 0, background: '#181a20', borderRadius: 20, boxShadow: '0 2px 12px #0004' }}>
        <h2 style={{ color: '#90caf9', fontSize: 22, marginBottom: 12, textAlign: 'center', fontWeight: 700 }}>Issue Heat Map</h2>
        <div style={{ height: 320, width: '100%', borderRadius: 16, overflow: 'hidden', margin: '0 auto', maxWidth: 540 }}>
          <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {issues.map((issue, i) => {
              const coords = getLatLng(issue.location);
              if (!coords) return null;
              return (
                <Circle
                  key={i}
                  center={coords}
                  radius={4000}
                  pathOptions={{ color: '#f44336', fillColor: '#f44336', fillOpacity: 0.4 }}
                />
              );
            })}
          </MapContainer>
        </div>
        <div style={{ textAlign: 'center', color: '#bdbdbd', fontSize: 13, marginTop: 6 }}>
          Red circles show reported issue locations (approximate heat map)
        </div>
      </div>

  {/* Display submitted issues - Gallery view */}
  <section className="card fade-in" style={{ marginTop: 36 }}>
        <h2 className="section-title">Submitted Issues</h2>
        {issues.length === 0 ? (
          <p className="center dim">No issues reported yet.</p>
        ) : (
          <div className="gallery-grid">
            {issues.map(issue => {
              const statusClass = issue.status === 'solved' ? 'green' : issue.status === 'underwork' ? 'amber' : issue.status === 'not solved' ? 'red' : 'blue';
              return (
                <article key={issue._id} className={`gallery-card border-${statusClass}`}>
                  {issue.photoUrl && (
                    <div className="g-media-wrapper">
                      <img src={`${API_BASE}${issue.photoUrl}`} alt={issue.description} className="g-photo" />
                      <span className={`g-badge status ${issue.status.replace(' ', '')}`}>{issue.status}</span>
                    </div>
                  )}
                  <div className="g-body">
                    <div className="g-head">
                      <span className="g-emoji" aria-hidden>{issue.category === 'pothole' ? '🕳️' : issue.category === 'streetlight' ? '💡' : issue.category === 'trash' ? '🗑️' : issue.category === 'water' ? '💧' : '📍'}</span>
                      <h3 className="g-title">{issue.description}</h3>
                    </div>
                    <div className="g-tags">
                      <span className="g-tag cat">{issue.category || '—'}</span>
                      <span className="g-tag dept">{issue.department ? `Dept: ${issue.department}` : ''}</span>
                      <span className="g-tag id" title={issue._id}>{issue._id.slice(0,8)}…</span>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => navigator.clipboard?.writeText(issue._id)}
                        aria-label="Copy Issue ID"
                      >📋</button>
                    </div>
                    <div className="g-meta"><span className="label">Location:</span>{issue.location}</div>
                    <div className="g-meta"><span className="label">Department:</span> {issue.department || '—'}</div>
                    <div className="g-meta time">{new Date(issue.createdAt).toLocaleString()}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
