import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { PieChart, Pie, Legend, LineChart, Line, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from "../firebase/firebase";
import PageTransition from "../components/PageTransition";
import "./Dashboard.css";

const Dashboard = () => {
  const [scans, setScans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Scans"); // "General" or "Scans"

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const scansRef = collection(db, "scans");
        const scansQuery = query(scansRef, orderBy("timestamp", "desc"), limit(500));
        const snapshot = await getDocs(scansQuery);
        const scanList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScans(scanList);
      } catch (error) {
        console.error("Error fetching scans:", error);
      }
    };

    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
    fetchUsers();
  }, []);

  // Scans data
  const feedbackedScans = scans.filter(scan => scan.feedback === "good" || scan.feedback === "bad");
  const totalFeedbacked = feedbackedScans.length;
  const goodFeedbackCount = feedbackedScans.filter(scan => scan.feedback === "good").length;
  const avgResponseTimeMs = totalFeedbacked > 0
    ? Math.round(feedbackedScans.reduce((sum, scan) => sum + (scan.latency_ms || 0), 0) / totalFeedbacked)
    : 0;
  const avgResponseTimeSec = (avgResponseTimeMs / 1000).toFixed(1);
  const goodFeedbackRate = totalFeedbacked > 0
    ? Math.round((goodFeedbackCount / totalFeedbacked) * 100)
    : 0;
  const confidenceScans = scans.filter(scan => scan.prediction?.confidence);
  const avgConfidence = confidenceScans.length > 0
    ? (confidenceScans.reduce((sum, scan) => sum + (scan.prediction.confidence || 0), 0) / confidenceScans.length * 100).toFixed(1)
    : 0;

  const plantScanCounts = {};
  scans.forEach(scan => {
    const plantName = scan.prediction?.name || "Unknown";
    plantScanCounts[plantName] = (plantScanCounts[plantName] || 0) + 1;
  });

  const plantScanData = Object.keys(plantScanCounts).map(name => ({
    name,
    value: plantScanCounts[name]
  }));

  const COLORS = ['var(--primary-green)', 'var(--secondary-color)', 'var(--text-green)', 'var(--light-green)', 'var(--bg-light)'];

  const scansByDate = scans.reduce((acc, scan) => {
    if (scan.timestamp) {
      const date = scan.timestamp.toDate().toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  const chartDataScans = Object.entries(scansByDate).map(([date, count]) => ({
    date,
    scans: count
  }));

  // ====== Users data ======
  const userPlantsCounts = {};
  users.forEach(user => {
    const userPlants = user.plants || [];
    userPlants.forEach(plantId => {
      userPlantsCounts[plantId] = (userPlantsCounts[plantId] || 0) + 1;
    });
  });

  const avgPlantsPerUser = users.length > 0 ? (users.reduce((sum, user) => sum + (user.plants?.length || 0), 0) / users.length).toFixed(1) : 0;

  const usersByDate = users.reduce((acc, user) => {
    if (user.createdAt) {
      const date = user.createdAt.toDate().toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  const chartDataUsers = Object.entries(usersByDate).map(([date, count]) => ({
    date,
    users: count
  }));

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  return (
    <div className="page-container bg-light">
      <PageTransition>
        <div className="content-container">
          <h2 className="page-title">Overview</h2>

          {/* Tabs */}
          <div className="tab-switch">
            <button
              className={activeTab === "General" ? "switch-button active" : "switch-button"}
              onClick={() => setActiveTab("General")}
            >
              General
            </button>
            <button
              className={activeTab === "Scans" ? "switch-button active" : "switch-button"}
              onClick={() => setActiveTab("Scans")}
            >
              Scans
            </button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {activeTab === "General" && (
                <>
                  <div className="stats-grid small-cards">
                    <div className="stat-card">
                      <p className="stat-title">Total Users</p>
                      <h3 className="stat-value">{users.length}</h3>
                    </div>
                    <div className="stat-card">
                      <p className="stat-title">Avg. Plants/User</p>
                      <h3 className="stat-value">{avgPlantsPerUser}</h3>
                    </div>
                  </div>

                  <div className="chart-card">
                    <h3 className="chart-title">New Users per Day</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartDataUsers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="var(--primary-green)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}

              {activeTab === "Scans" && (
                <>
                  <div className="stats-grid small-cards">
                    <div className="stat-card">
                      <p className="stat-title">Total Scans</p>
                      <h3 className="stat-value">{scans.length}</h3>
                    </div>
                    <div className="stat-card">
                      <p className="stat-title">Avg. Response Time</p>
                      <h3 className="stat-value">{avgResponseTimeSec}s</h3>
                    </div>
                    <div className="stat-card">
                      <p className="stat-title">Good Feedback Rate</p>
                      <h3 className="stat-value">{goodFeedbackRate}%</h3>
                    </div>
                    <div className="stat-card">
                      <p className="stat-title">Avg. Confidence</p>
                      <h3 className="stat-value">{avgConfidence}%</h3>
                    </div>
                  </div>

                  <div className="chart-grid">
                    <div className="chart-card">
                      <h3 className="chart-title">Scans per Plant</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={plantScanData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius="80%"
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {plantScanData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={12}
                            content={({ payload }) => (
                              <ul className="custom-legend">
                                {payload.map((entry, index) => (
                                  <li key={`item-${index}`} className="legend-item">
                                    <span
                                      className="legend-color"
                                      style={{ backgroundColor: entry.color }}
                                    />
                                    {entry.value}
                                  </li>
                                ))}
                              </ul>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                      <h3 className="chart-title">Scans per Day</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartDataScans}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="scans" fill="var(--secondary-color)" opacity={0.7} />
                          <Line type="monotone" dataKey="scans" stroke="var(--primary-green)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="scans-table">
                    <h3>Scan Details</h3>
                    <div className="table-header">
                      <span>Plant</span>
                      <span>Confidence</span>
                      <span>Latency</span>
                      <span>Feedback</span>
                      <span>Time</span>
                    </div>
                    {scans.map(scan => (
                      <div key={scan.id} className="table-row">
                        <span>{scan.prediction?.name || "Unknown"}</span>
                        <span>{Math.round((scan.prediction?.confidence || 0) * 100)}%</span>
                        <span>{scan.latency_ms} ms</span>
                        <span className={`feedback ${scan.feedback || "na"}`}>
                          {scan.feedback ? scan.feedback : "N/A"}
                        </span>
                        <span>{formatTimestamp(scan.timestamp)}</span>
                      </div>
                    ))}
                  </div>

                </>
              )}
            </>
          )}
        </div>
      </PageTransition>
    </div>
  );
};

export default Dashboard;
