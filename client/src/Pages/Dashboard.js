import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { TopNav, BotNav } from "../components/Nav";
import PageTransition from "../components/PageTransition";
import "./Dashboard.css";

const Dashboard = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0); // ✅ new

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const scansRef = collection(db, "scans");
        const scansQuery = query(scansRef, orderBy("timestamp", "desc"), limit(500));
        const snapshot = await getDocs(scansQuery);

        const scanList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setScans(scanList);
      } catch (error) {
        console.error("Error fetching scans:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => { // ✅ new
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnapshot.size);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchScans();
    fetchUsers(); // ✅ new
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleString();
  };

  // Stats
  const feedbackedScans = scans.filter(scan => scan.feedback === "good" || scan.feedback === "bad");
  const totalFeedbacked = feedbackedScans.length;
  const goodFeedbackCount = feedbackedScans.filter(scan => scan.feedback === "good").length;
  const avgResponseTimeMs = feedbackedScans.length > 0
    ? Math.round(feedbackedScans.reduce((sum, scan) => sum + (scan.latency_ms || 0), 0) / feedbackedScans.length)
    : 0;
  const avgResponseTimeSec = (avgResponseTimeMs / 1000).toFixed(1);
  const goodFeedbackRate = totalFeedbacked > 0
    ? Math.round((goodFeedbackCount / totalFeedbacked) * 100)
    : 0;

  const confidenceScans = scans.filter(scan => scan.prediction?.confidence);
  const avgConfidence = confidenceScans.length > 0
    ? (confidenceScans.reduce((sum, scan) => sum + (scan.prediction.confidence || 0), 0) / confidenceScans.length * 100).toFixed(1)
    : 0;

  return (
    <div className="page-container bg-light">
      <PageTransition>
        <div className="content-container">
          <h2 className="page-title">Overview</h2>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-title">Total Users</p>
                  <h3 className="stat-value">{totalUsers}</h3> {/* ✅ added */}
                </div>
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

              {/* Table */}
              <div className="scans-table">
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
        </div>
      </PageTransition>
    </div>
  );
};

export default Dashboard;
