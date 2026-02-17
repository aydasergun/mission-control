import React from 'react';
import { FileCode, Bot, Settings, Database, Terminal } from 'lucide-react';

const commands = [
  { icon: FileCode, name: 'New Script', description: 'Create a new script file' },
  { icon: Bot, name: 'Run Agent', description: 'Execute a new agent instance' },
  { icon: Settings, name: 'Settings', description: 'Adjust application settings' },
  { icon: Database, name: 'Database', description: 'Manage your database' },
  { icon: Terminal, name: 'Terminal', description: 'Open a terminal' },
];

interface CommandHintsProps {
  show: boolean;
}

export default function CommandHints({ show }: CommandHintsProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="absolute bottom-full mb-2 w-full bg-zinc-800/50 backdrop-blur-lg border border-zinc-700/50 rounded-lg shadow-lg p-4">
      <p className="text-xs text-zinc-400 mb-2">QUICK COMMANDS</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {commands.map((command, index) => (
          <div key={index} className="flex items-center p-2 rounded-md hover:bg-zinc-700/50 cursor-pointer">
            <command.icon className="w-4 h-4 mr-2 text-zinc-300" />
            <div>
              <p className="text-sm text-zinc-100">{command.name}</p>
              <p className="text-xs text-zinc-400">{command.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
