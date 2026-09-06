# Cosmic Dogfight 🚀 2D Multiplayer Space Combat

[![Deploy to GitHub Pages](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![WebRTC](https://img.shields.io/badge/Networking-WebRTC%20P2P-indigo.svg)](https://webrtc.org)
[![Next.js 15](https://img.shields.io/badge/Framework-Next.js%2015-black.svg)](https://nextjs.org)

An exhilarating, real-time 2D multiplayer space dogfight game designed with a **Deep Cosmic / Artistic Flair** aesthetic. Built with **Next.js 15, TypeScript, Tailwind CSS, HTML5 Canvas**, and **PeerJS (WebRTC)**.

**100% Free Hosting**: No backend game servers or dedicated server costs required! The match is hosted peer-to-peer directly between player browsers with global STUN NAT traversal.

---

## 🎮 Features

- **P2P Multiplayer**: Share a 5-character room code or one-click invite link to duel friends anywhere in the world.
- **3 Distinct Ship Classes**:
  - **Interceptor**: High speed, rapid twin plasma cannons, nimble turning.
  - **Vanguard**: Heavy hull, reinforced energy shields, high-impact heavy slug cannon.
  - **Wraith**: Silent stalker with hyper-thrust and long-range high-velocity railgun.
- **Dynamic Orbital Arena**:
  - Procedural asteroid fields with destructive splitting physics.
  - Tactical power-ups: Triple Shot, Railgun, Shield Overcharge, and Repair Nanites.
  - Neon boundary forcefield with velocity-deflection mechanics.
- **Full Dual-Input Support**:
  - **Desktop**: Mouse aiming with WASD / Arrow Keys propulsion, Spacebar/Left-Click fire, Shift boost, E shield.
  - **Mobile / Touch**: Dual virtual thumbsticks with dedicated tactile combat buttons.
- **Solo Practice & AI Bots**: Host can dynamically spawn and despawn AI drone fighters in real time.
- **Web Audio FX**: Procedural synthesizers for laser fire, explosions, shield impacts, and power-up collections with instant mute toggle.

---

## 🕹️ Controls

| Action | Desktop Keyboard / Mouse | Mobile / Tablet Touch |
| :--- | :--- | :--- |
| **Thrust / Move** | `W` or `↑` (Arrow Up) | Left Thumbstick |
| **Turn / Aim** | `A`/`D` or Mouse Crosshair | Right Thumbstick / Drag |
| **Primary Fire** | `Space` or Left Click | Red Crosshair Button |
| **Afterburner Boost** | `Shift` | Purple Flame Button |
| **Energy Shield** | `E` or Right Click | Cyan Shield Button |
| **Brake / Reverse** | `S` or `↓` (Arrow Down) | Left Thumbstick Down |

---

## 🚀 Free Hosting on GitHub Pages

This project is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) to deploy automatically to GitHub Pages for free:

1. Push this repository to GitHub.
2. In your GitHub repository:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every commit pushed to `main` will build and publish your game to `https://<username>.github.io/<repo-name>/`!

---

## 💻 Local Development

Clone the repo and start the local dev server:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Open multiple tabs or invite a friend to test real-time dogfights!

---

## 🛰️ Networking Architecture

```
[ Host Browser (Authoritative Physics Loop @ 60 FPS) ]
       ▲
       │  WebRTC DataChannel (Reliable SCTP + STUN NAT Traversal)
       ▼
[ Client Browser (Interpolated Render + 45Hz Input Stream) ]
```

- **Host-Authoritative**: The host simulates bullet physics, asteroid collisions, power-up collections, health, and kill verification.
- **Global STUN Negotiation**: Traverses NATs and firewalls worldwide using Google, Cloudflare, and Twilio STUN relays.
- **State Synchronization**: Authoritative 30Hz world snapshots sent to all connected peers.
