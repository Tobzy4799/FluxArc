// components/ArtifactActions.tsx
export default function ArtifactActions({ agentId, output }: { agentId: string, output: string }) {
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      <button 
        onClick={() => navigator.clipboard.writeText(output)}
        className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-white transition-all"
      >
        Copy to Clipboard
      </button>

      {/* Solidity Guard */}
      {agentId === 'solidity-auditor' && (
        <button onClick={() => downloadFile(output, 'audit-report.md', 'text/markdown')} className="text-xs bg-fuchsia-600 px-3 py-1.5 rounded text-white">
          Download Audit (.md)
        </button>
      )}

      {/* ScrapeMaster */}
      {agentId === 'web-scraper' && (
        <button onClick={() => downloadFile(output, 'data.csv', 'text/csv')} className="text-xs bg-lime-600 px-3 py-1.5 rounded text-white">
          Download CSV
        </button>
      )}

      {/* SocialPulse */}
      {agentId === 'social-manager' && (
        <button onClick={() => downloadFile(output, 'social-draft.txt', 'text/plain')} className="text-xs bg-purple-600 px-3 py-1.5 rounded text-white">
          Save as Draft (.txt)
        </button>
      )}

      {/* YT Catalyst */}
      {agentId === 'youtube-optimizer' && (
        <button onClick={() => downloadFile(output, 'yt-schema.json', 'application/json')} className="text-xs bg-red-600 px-3 py-1.5 rounded text-white">
          Export Schema (.json)
        </button>
      )}

      {/* LinguaBridge */}
      {agentId === 'global-localizer' && (
        <button onClick={() => navigator.clipboard.writeText(output)} className="text-xs bg-blue-600 px-3 py-1.5 rounded text-white">
          Copy Translated Text
        </button>
      )}
    </div>
  );
}