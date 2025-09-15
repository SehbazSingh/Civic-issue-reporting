import React from 'react';
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function IssueMap({ issues }) {
  // Helper: extract coordinates from issue.location ("lat, lng")
  function getLatLng(loc) {
    if (!loc) return null;
    const parts = loc.split(',').map(Number);
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
    return { lat: parts[0], lng: parts[1] };
  }

  // Priority: sort by urgency, then volume (for demo, urgency = status or category)
  // You can enhance this logic as needed
  const priorityColor = issue => {
    if (issue.status === 'not solved') return '#f44336'; // urgent
    if (issue.status === 'underwork') return '#ff9800';
    if (issue.status === 'solved') return '#4caf50';
    return '#1976d2';
  };

  return (
    <div style={{ width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 12px #0002' }}>
      <MapContainer center={[22.9734, 78.6569]} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} dragging={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issues.map((issue, i) => {
          const coords = getLatLng(issue.location);
          if (!coords) return null;
          return (
            <Circle
              key={issue._id || i}
              center={coords}
              radius={4000}
              pathOptions={{ color: priorityColor(issue), fillColor: priorityColor(issue), fillOpacity: 0.5 }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                <div style={{ fontSize: 13 }}>
                  <div><b>{issue.category}</b></div>
                  <div>{issue.description}</div>
                  <div>Status: <b>{issue.status}</b></div>
                  <div style={{ color: '#888' }}>{issue.city}, {issue.state}</div>
                </div>
              </Tooltip>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
