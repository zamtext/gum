'use client';

import React, { useState } from 'react';
import { Github, Check, Copy, X, Terminal, Globe, ServerOff, ShieldCheck } from 'lucide-react';

interface GitHubExportGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const GITHUB_ACTIONS_WORKFLOW = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build static export
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./out

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

export default function GitHubExportGuide({ isOpen, onClose }: GitHubExportGuideProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GITHUB_ACTIONS_WORKFLOW);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0c]/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#15151a]/95 border-2 border-indigo-500/40 rounded-3xl shadow-2xl shadow-indigo-950/70 p-6 sm:p-7 text-slate-100 my-8 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter italic text-base text-white">Host 100% Free on GitHub Pages</h3>
              <p className="text-xs text-slate-400">Zero backend server required — WebRTC P2P direct connectivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-slate-800">
            <ServerOff className="w-4 h-4 text-indigo-400 mb-1.5" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Zero Server Cost</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Host runs on free GitHub Pages static servers without paying for VPS or game servers.
            </p>
          </div>
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-slate-800">
            <Globe className="w-4 h-4 text-purple-400 mb-1.5" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">WebRTC P2P</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Direct browser-to-browser UDP data channels with free public STUN/signaling relay.
            </p>
          </div>
          <div className="bg-[#0a0a0c] p-3.5 rounded-2xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-amber-400 mb-1.5" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Authoritative Host</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Room creator&apos;s browser runs physics at 60 FPS, syncs to connected peers.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 text-xs text-slate-300 mb-4">
          <div className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[11px] flex items-center justify-center font-bold">
              1
            </span>
            <div>
              <span className="font-bold text-white">Enable Static Export in next.config.ts</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Ensure <code className="text-indigo-300 bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-slate-800 font-mono">output: &apos;export&apos;</code> is set (and <code className="text-indigo-300 bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-slate-800 font-mono">images: &#123; unoptimized: true &#125;</code>) so <code className="text-indigo-300 bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-slate-800 font-mono">npm run build</code> outputs static files to <code className="text-indigo-300 bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-slate-800 font-mono">./out</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[11px] flex items-center justify-center font-bold">
              2
            </span>
            <div className="flex-1">
              <span className="font-bold text-white">Add GitHub Actions Workflow</span>
              <p className="text-slate-400 text-[11px] mt-0.5 mb-1.5">
                Save the workflow below as <code className="text-indigo-300 bg-[#0a0a0c] px-1.5 py-0.5 rounded border border-slate-800 font-mono">.github/workflows/deploy.yml</code>:
              </p>
              <div className="relative bg-[#0a0a0c] rounded-xl p-3 border border-slate-800 font-mono text-[11px] max-h-36 overflow-y-auto text-slate-300">
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <pre>{GITHUB_ACTIONS_WORKFLOW}</pre>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[11px] flex items-center justify-center font-bold">
              3
            </span>
            <div>
              <span className="font-bold text-white">Configure Repository Settings</span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Go to your GitHub repo <span className="text-white font-medium">Settings → Pages</span>, and under{' '}
                <span className="text-white font-medium">Build and deployment → Source</span>, select{' '}
                <span className="text-indigo-300 font-bold">GitHub Actions</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Works on free GitHub accounts & paid plans
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-black uppercase tracking-wider transition shadow-[0_0_15px_rgba(99,102,241,0.4)] border border-indigo-400/30"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
