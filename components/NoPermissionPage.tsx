"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footbar";

export default function NoPermissionPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        .no-perm-page {
          min-height: 100vh;
          background: #050a0f;
          display: flex;
          flex-direction: column;
          font-family: 'Inter', sans-serif;
        }

        /* Breadcrumb bar */
        .no-perm-breadcrumb {
          background: #060c14;
          border-bottom: 1px solid #0d2030;
          padding: 10px 20px;
          font-size: 13px;
          color: #4a7a94;
        }
        .no-perm-breadcrumb span {
          color: #b8cfd8;
          font-weight: 600;
        }

        /* Main content wrapper */
        .no-perm-main {
          flex: 1;
          padding: 28px 16px 48px;
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
        }

        /* Card */
        .no-perm-card {
          background: #080e18;
          border: 1px solid #0d2030;
          border-radius: 10px;
          overflow: hidden;
        }

        /* Card header — red banner with title */
        .no-perm-card-header {
          background: linear-gradient(135deg, #c0392b, #e74c3c);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .no-perm-card-header-badge {
          background: rgba(0,0,0,0.25);
          border-radius: 5px;
          padding: 4px 12px;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        /* Card title above the red bar */
        .no-perm-section-title {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: #e74c3c;
          text-transform: uppercase;
          padding: 20px 20px 14px;
          border-bottom: 1px solid #0d2030;
        }

        /* Card body */
        .no-perm-body {
          padding: 22px 22px 28px;
          color: #b8cfd8;
        }

        .no-perm-intro {
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 20px;
          color: #a0bfcc;
        }

        .no-perm-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          counter-reset: perm-counter;
        }

        .no-perm-list li {
          display: flex;
          gap: 12px;
          font-size: 14px;
          line-height: 1.65;
          color: #8ab0bf;
          counter-increment: perm-counter;
        }

        .no-perm-list li::before {
          content: counter(perm-counter) ".";
          color: #e74c3c;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .no-perm-link {
          color: #00b4d8;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }
        .no-perm-link:hover { color: #0077b6; text-decoration: underline; }

        .no-perm-link-bold {
          color: #b8cfd8;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }
        .no-perm-link-bold:hover { color: #00b4d8; }

        /* Back button */
        .no-perm-back {
          margin-top: 24px;
          display: flex;
          justify-content: flex-start;
        }
        .no-perm-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          background: linear-gradient(135deg, #0077b6, #00b4d8);
          border: none;
          border-radius: 8px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.15s;
        }
        .no-perm-back-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <div className="no-perm-page">
        <Navbar />

        {/* Breadcrumb */}
        <div className="no-perm-breadcrumb" style={{ marginTop: 64 }}>
          <a href="#" className="no-perm-link" style={{ fontWeight: 500 }}>Home</a>
          {" "}&rsaquo;{" "}
          <span>No Permission</span>
        </div>

        {/* Main */}
        <main className="no-perm-main">
          <div className="no-perm-card">

            {/* Section title */}
            <div className="no-perm-section-title">No Permission</div>

            {/* Red header bar */}
            <div className="no-perm-card-header">
              <span className="no-perm-card-header-badge">MRCombo</span>
            </div>

            {/* Body */}
            <div className="no-perm-body">
              <p className="no-perm-intro">
                You are either not logged in or do not have permission to view this page.
                This could be because one of the following reasons:
              </p>

              <ol className="no-perm-list">
                <li>
                  <span>
                    You are not logged in or registered. Please login and retry the desired action.{" "}
                    <a href="#" className="no-perm-link">Login</a>
                    {" | "}
                    <a href="#" className="no-perm-link-bold">Need to register?</a>
                  </span>
                </li>
                <li>
                  <span>
                    You do not have permission to access this page. Are you trying to access
                    administrative pages or a resource that you shouldn&apos;t be? Check in the
                    forum rules that you are allowed to perform this action.
                  </span>
                </li>
                <li>
                  <span>
                    Your account may have been disabled by an administrator, or it may be
                    awaiting account activation.
                  </span>
                </li>
                <li>
                  <span>
                    You have accessed this page directly rather than using appropriate forms or links.
                  </span>
                </li>
              </ol>

              <div className="no-perm-back">
                <a href="/" className="no-perm-back-btn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Go Back Home
                </a>
              </div>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}