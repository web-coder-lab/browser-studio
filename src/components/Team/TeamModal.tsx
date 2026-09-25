import React, { useState } from 'react';
import { CollaboratorMember, UserAccount } from '../../types/ide';
import { addCollaboratorByUsername, removeCollaborator } from '../../services/authService';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  X, 
  Share2, 
  Check, 
  Copy, 
  Radio, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: CollaboratorMember[];
  setCollaborators: React.Dispatch<React.SetStateAction<CollaboratorMember[]>>;
  currentUser: UserAccount | null;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  collaborators,
  setCollaborators,
  currentUser,
}) => {
  const [inviteInput, setInviteInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = addCollaboratorByUsername(inviteInput, collaborators);
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to invite collaborator.');
      return;
    }

    if (res.member) {
      setCollaborators((prev) => [...prev, res.member!]);
      setInviteInput('');
    }
  };

  const handleRemove = (memberId: string) => {
    const updated = removeCollaborator(memberId, collaborators);
    setCollaborators(updated);
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/#workspace-room-${Math.random().toString(36).substring(2, 8)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn font-sans">
      <div className="w-full max-w-2xl bg-[#0c0f17] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="h-14 bg-[#090b12] border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Team Collaboration & Friends</h2>
              <p className="text-[11px] text-slate-400">Collaborate simultaneously on the same workspace</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Invite Friend Form */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Invite Friend by Username
              </span>
              <span className="text-[10px] text-indigo-400 font-mono">Real-Time P2P Sync</span>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleInvite} className="flex gap-2">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Enter collaborator username (e.g. sarah_cloud, kali_sec)..."
                className="flex-1 bg-[#080a11] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </form>
          </div>

          {/* Quick Invite Link */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#090c13] border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Share2 className="w-4 h-4 text-indigo-400" />
              <span>Shareable Direct Workspace Room Link</span>
            </div>
            <button
              onClick={handleCopyInviteLink}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied Link' : 'Copy Room Link'}</span>
            </button>
          </div>

          {/* Active Collaborators List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Workspace Members ({collaborators.length + 1})
              </span>
            </div>

            {/* Current User (Owner) */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                  style={{ backgroundColor: currentUser?.avatarColor || '#6366f1' }}
                >
                  {(currentUser?.username || 'You').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{currentUser?.displayName || 'Current User'}</span>
                    <span className="text-indigo-400 font-mono text-[11px]">(@{currentUser?.username || 'you'})</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      You (Host)
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400">{currentUser?.email || 'local@studio.io'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Host Active</span>
                </span>
              </div>
            </div>

            {/* Collaborator Friends */}
            {collaborators.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-xl bg-[#090c13] border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{member.displayName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">(@{member.username})</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {member.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                      <span>{member.email}</span>
                      {member.activeFile && (
                        <span className="text-cyan-400 font-mono">Editing {member.activeFile}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-[10.5px] text-emerald-400 font-medium mr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Online</span>
                  </span>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove Collaborator"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#090b12] border-t border-slate-800 px-6 flex items-center justify-between shrink-0 text-xs text-slate-400">
          <span>End-to-End Encrypted Team Collaboration</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
