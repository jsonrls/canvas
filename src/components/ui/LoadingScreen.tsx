"use client";

import React, { useEffect, useState } from "react";

const STATUS_MESSAGES = [
  "Preparing your study canvas…",
  "Loading collaborative tools…",
  "Syncing your board spaces…",
  "Almost ready…",
];

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({
  message,
}: LoadingScreenProps): React.ReactElement {
  const [messageIndex, setMessageIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const messages = message ? [message] : STATUS_MESSAGES;

  useEffect(() => {
    if (messages.length <= 1) return;

    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMessageIndex((i) => (i + 1) % messages.length);
        setVisible(true);
      }, 350);
    }, 2200);

    return () => clearInterval(cycle);
  }, [messages.length]);

  return (
    <main
      className="bp-loading-shell"
      aria-label="Loading BoardPrep Canvas"
      role="status"
    >
      {/* Ambient background orbs */}
      <div
        className="bp-loading-orb bp-loading-orb--amber"
        aria-hidden="true"
      />
      <div className="bp-loading-orb bp-loading-orb--blue" aria-hidden="true" />
      <div
        className="bp-loading-orb bp-loading-orb--cream"
        aria-hidden="true"
      />

      {/* Central stage */}
      <div className="bp-loading-stage" aria-hidden="true">
        {/* Outer orbit ring */}
        <div className="bp-loading-ring bp-loading-ring--outer">
          <span className="bp-loading-dot bp-loading-dot--1" />
          <span className="bp-loading-dot bp-loading-dot--2" />
          <span className="bp-loading-dot bp-loading-dot--3" />
        </div>

        {/* Middle orbit ring */}
        <div className="bp-loading-ring bp-loading-ring--mid">
          <span className="bp-loading-dot bp-loading-dot--4" />
          <span className="bp-loading-dot bp-loading-dot--5" />
        </div>

        {/* Logo mark */}
        <div className="bp-loading-mark">
          <svg
            className="bp-loading-mark-svg"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Stylised BP monogram — two overlapping rounded rectangles */}
            <rect
              className="bp-loading-mark-rect bp-loading-mark-rect--b"
              x="6"
              y="8"
              width="20"
              height="32"
              rx="6"
              fill="currentColor"
            />
            <rect
              className="bp-loading-mark-rect bp-loading-mark-rect--p"
              x="22"
              y="8"
              width="20"
              height="32"
              rx="6"
              fill="currentColor"
            />
            {/* Crossbar highlight */}
            <rect
              className="bp-loading-mark-bar"
              x="6"
              y="22"
              width="36"
              height="4"
              rx="2"
              fill="currentColor"
              opacity="0.18"
            />
          </svg>
        </div>

        {/* Radial shimmer beams */}
        <div className="bp-loading-beams" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="bp-loading-beam"
              style={{ "--beam-i": i } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      {/* Brand wordmark */}
      <p className="bp-loading-wordmark" aria-hidden="true">
        BoardPrep <span>Canvas</span>
      </p>

      {/* Cycling status message */}
      <p
        className={`bp-loading-status ${visible ? "bp-loading-status--visible" : ""}`}
        aria-live="polite"
      >
        {messages[messageIndex]}
      </p>

      {/* Progress bar */}
      <div className="bp-loading-progress" aria-hidden="true">
        <div className="bp-loading-progress-track">
          <div className="bp-loading-progress-fill" />
        </div>
      </div>
    </main>
  );
}
